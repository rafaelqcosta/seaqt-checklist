// ==UserScript==
// @name         SEAQT · Ponte BRADO
// @namespace    https://rafaelqcosta.github.io/seaqt-checklist/
// @version      0.2.0
// @description  Lê a escala do dia no BRADO (só leitura) e entrega ao SEAQT aberto no mesmo navegador.
// @match        https://brado.cbm.df.gov.br/*
// @match        https://rafaelqcosta.github.io/seaqt-checklist/*
// @match        http://localhost:5180/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// @noframes
// @updateURL    https://rafaelqcosta.github.io/seaqt-checklist/seaqt-ponte-brado.user.js
// @downloadURL  https://rafaelqcosta.github.io/seaqt-checklist/seaqt-ponte-brado.user.js
// ==/UserScript==

/*
 * Como funciona
 * - Na aba do BRADO: lê a escala do dia de serviço (ao abrir e a cada 15 min, ou quando o SEAQT pede)
 *   usando o login que o usuário já fez. Usa SÓ a consulta fnBradoListaEscalaServico e a foto do
 *   militar (/oauth/avatar, a mesma que o BRADO mostra); nunca chama as funções de escrita do BRADO
 *   ("Cadastra..."). Nenhuma senha, cookie ou token é lido ou guardado.
 * - Na aba do SEAQT: entrega a escala lida ao SEAQT, que grava com o login do próprio usuário.
 * - As duas abas conversam pelo armazenamento do próprio Tampermonkey, neste navegador.
 */
;(() => {
  'use strict'

  // codLotacao do BRADO: 2016 = Merg. DELTA 1 (BUC), 2015 = Merg. GBS. Mesma lista do SEAQT (LOTACOES_BRADO).
  const LOTACOES = [2016, 2015]
  const INTERVALO_LEITURA_MS = 15 * 60_000
  const PULSO_MS = 30_000
  const BRADO_VIVO_MS = 90_000
  const ESPERA_RESPOSTA_MS = 60_000
  const FUSO = 'America/Sao_Paulo'
  const HORA_TROCA_SERVICO = 7

  const CHAVES = {
    escala: 'seaqt.escala',
    pedido: 'seaqt.pedido',
    erro: 'seaqt.erro',
    bradoVivo: 'seaqt.bradoVivo',
  }

  /** Dia de serviço em curso (YYYY-MM-DD): antes das 07h de Brasília ainda vale o dia anterior. */
  function diaServicoAtual() {
    const partes = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value]),
    )
    const hoje = new Date(Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day)))
    if (Number(partes.hour) < HORA_TROCA_SERVICO) hoje.setUTCDate(hoje.getUTCDate() - 1)
    return hoje.toISOString().slice(0, 10)
  }

  if (location.hostname === 'brado.cbm.df.gov.br') ladoBrado()
  else ladoSeaqt()

  // -------------------------------------------------------------------------
  // Aba do BRADO: lê a escala
  // -------------------------------------------------------------------------
  function ladoBrado() {
    // na tela de login não há sessão para ler
    if (location.pathname.includes('/auth/')) return

    const consulta = (comCodPessoa) => `query MilitaresEscalas($pCodLotacao: Int, $pDatReferencia: Date) {
      fnBradoListaEscalaServico(pCodLotacao: $pCodLotacao, pDatReferencia: $pDatReferencia) {
        nodes { vlrIdentificacaoUnica sglPostoGraduacao nomGuerraServidor nomTurno flgServico jsonPresenca${comCodPessoa ? ' codPessoaServidor' : ''} }
      }
    }`
    // se o BRADO não aceitar codPessoaServidor nessa consulta, a escala segue sem fotos
    let aceitaCodPessoa = true

    // fotos já baixadas nesta aba (codPessoa -> data URL ou null): cada uma é pedida uma vez só
    const fotos = new Map()
    async function lerFoto(codPessoa) {
      if (codPessoa == null) return null
      if (!fotos.has(codPessoa)) {
        let foto = null
        try {
          const resposta = await fetch(`/api-nexus/oauth/avatar/${codPessoa}`, { credentials: 'include' })
          const base64 = resposta.ok ? (await resposta.json())?.base64 : null
          if (typeof base64 === 'string' && base64) foto = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
        } catch {
          // sem foto não impede a escala
        }
        fotos.set(codPessoa, foto)
      }
      return fotos.get(codPessoa)
    }

    function faltaLancada(no) {
      return (no.jsonPresenca ?? []).some((p) => p.cod_motivo_falta != null || p.flg_presenca === false)
    }

    async function lerLotacao(data, codLotacao) {
      const resposta = await fetch('/api-nexus/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operationName: 'MilitaresEscalas',
          variables: { pCodLotacao: codLotacao, pDatReferencia: data.replaceAll('-', '/') },
          query: consulta(aceitaCodPessoa),
        }),
      })
      if (resposta.status === 401 || resposta.status === 403) {
        throw new Error('A sessão do BRADO expirou. Recarregue a aba do BRADO (ou entre de novo) e sincronize.')
      }
      if (!resposta.ok) throw new Error(`O BRADO respondeu com erro ${resposta.status}.`)
      const json = await resposta.json()
      if (json.errors?.length) {
        if (aceitaCodPessoa && json.errors.some((e) => String(e.message).includes('codPessoaServidor'))) {
          aceitaCodPessoa = false
          return lerLotacao(data, codLotacao)
        }
        throw new Error(`BRADO: ${json.errors[0].message}`)
      }
      // flgServico = false: saiu da escala (postergação, dispensa...). Só vai quem está de serviço.
      const nos = (json.data?.fnBradoListaEscalaServico?.nodes ?? []).filter((no) => no.flgServico)
      const militares = []
      for (const no of nos) {
        militares.push({
          matricula: String(no.vlrIdentificacaoUnica ?? ''),
          posto: no.sglPostoGraduacao ?? '',
          nomeGuerra: no.nomGuerraServidor ?? '',
          turno: no.nomTurno ?? null,
          aviso: faltaLancada(no) ? 'Falta lançada no BRADO' : null,
          foto: await lerFoto(no.codPessoaServidor),
        })
      }
      return militares
    }

    let lendo = false
    async function sincronizar(data) {
      if (lendo) return
      lendo = true
      try {
        const lotacoes = []
        for (const codLotacao of LOTACOES) lotacoes.push({ codLotacao, militares: await lerLotacao(data, codLotacao) })
        GM_setValue(CHAVES.escala, { id: `${data}@${Date.now()}`, data, lidoEm: new Date().toISOString(), lotacoes })
      } catch (erro) {
        GM_setValue(CHAVES.erro, { mensagem: erro.message || String(erro), em: Date.now() })
      } finally {
        lendo = false
      }
    }

    /** Leitura automática: pula se outra aba do BRADO já leu este dia há pouco. */
    function sincronizarDiaAtual() {
      const data = diaServicoAtual()
      const ultima = GM_getValue(CHAVES.escala, null)
      if (ultima?.data === data && Date.now() - Date.parse(ultima.lidoEm) < INTERVALO_LEITURA_MS - 60_000) return
      sincronizar(data)
    }

    const pulsar = () => GM_setValue(CHAVES.bradoVivo, Date.now())
    pulsar()
    setInterval(pulsar, PULSO_MS)

    GM_addValueChangeListener(CHAVES.pedido, (_chave, _antigo, pedido) => {
      if (pedido?.data) sincronizar(pedido.data)
    })

    sincronizarDiaAtual()
    setInterval(sincronizarDiaAtual, INTERVALO_LEITURA_MS)
  }

  // -------------------------------------------------------------------------
  // Aba do SEAQT: entrega a escala ao app
  // -------------------------------------------------------------------------
  function ladoSeaqt() {
    const enviar = (mensagem) => window.postMessage({ origem: 'seaqt-ponte', ...mensagem }, location.origin)
    const bradoAberto = () => Date.now() - GM_getValue(CHAVES.bradoVivo, 0) < BRADO_VIVO_MS
    const enviarEstado = () => enviar({ tipo: 'estado', bradoAberto: bradoAberto() })
    // a foto vai junto; o SEAQT só a grava para quem ainda não tem foto
    const enviarEscala = (escala) => escala && enviar({ tipo: 'escala', ...escala })

    let espera = null
    const pararEspera = () => {
      clearTimeout(espera)
      espera = null
    }

    window.addEventListener('message', (evento) => {
      if (evento.origin !== location.origin || evento.data?.origem !== 'seaqt-app') return
      if (evento.data.tipo === 'ola') {
        enviarEstado()
        enviarEscala(GM_getValue(CHAVES.escala, null))
      } else if (evento.data.tipo === 'sincronizar') {
        if (!bradoAberto()) {
          enviar({ tipo: 'erro', mensagem: 'Nenhuma aba do BRADO aberta. Entre no BRADO em outra aba e tente de novo.' })
          return
        }
        GM_setValue(CHAVES.pedido, { data: evento.data.data, em: Date.now() })
        pararEspera()
        espera = setTimeout(() => enviar({ tipo: 'erro', mensagem: 'O BRADO não respondeu. Recarregue a aba do BRADO e tente de novo.' }), ESPERA_RESPOSTA_MS)
      }
    })

    GM_addValueChangeListener(CHAVES.escala, (_chave, _antiga, escala) => {
      pararEspera()
      enviarEscala(escala)
    })
    GM_addValueChangeListener(CHAVES.erro, (_chave, _antigo, erro) => {
      pararEspera()
      if (erro) enviar({ tipo: 'erro', mensagem: erro.mensagem })
    })

    enviarEstado()
    enviarEscala(GM_getValue(CHAVES.escala, null))
    setInterval(enviarEstado, 15_000)
  }
})()
