import { useCallback, useEffect, useRef, useState } from 'react'
import { avisar } from '../lib/avisos'
import { valorIds } from '../lib/checklist'
import * as dados from '../lib/dados'
import { mensagemErro, supabase } from '../lib/supabase'
import type { Cadastros, Condicao, DadosDia, Militar, MilitarBrado, NovaOrdem, OrdemMissao, Viatura } from '../lib/tipos'

const INTERVALO_SEGURANCA_MS = 60_000
const ESPERA_REALTIME_MS = 350

/**
 * Dados do dia de serviço + cadastros, sempre atualizados:
 * carrega tudo, escuta o Realtime do Supabase e recarrega a cada minuto como segurança.
 * As ações aplicam a mudança na tela na hora (otimista) e gravam em seguida.
 */
export function useBriefing(dataServico: string) {
  const [cadastros, setCadastros] = useState<Cadastros | null>(null)
  const [dia, setDia] = useState<DadosDia | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)
  const [sincronizadoEm, setSincronizadoEm] = useState<Date | null>(null)
  // Cada carga ou alteração local incrementa a geração; respostas antigas são descartadas.
  const geracao = useRef(0)
  // Ações que terminam depois de o usuário trocar de dia chamam o recarregar do dia antigo: ignorar.
  const dataAtual = useRef(dataServico)

  const recarregar = useCallback(async () => {
    if (dataServico !== dataAtual.current) return
    const minhaGeracao = ++geracao.current
    try {
      const [novosCadastros, novoDia] = await Promise.all([dados.buscarCadastros(), dados.buscarDia(dataServico)])
      if (minhaGeracao !== geracao.current) return
      setCadastros(novosCadastros)
      setDia(novoDia)
      setErro(null)
      setSincronizadoEm(new Date())
    } catch (e) {
      if (minhaGeracao === geracao.current) setErro(mensagemErro(e))
    }
  }, [dataServico])

  useEffect(() => {
    dataAtual.current = dataServico
    setDia(null)
    recarregar()

    let espera: ReturnType<typeof setTimeout> | undefined
    const agendar = () => {
      clearTimeout(espera)
      espera = setTimeout(recarregar, ESPERA_REALTIME_MS)
    }

    const canal = supabase.channel(`seaqt-${dataServico}-${crypto.randomUUID()}`)
    for (const tabela of dados.TABELAS) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, agendar)
    }
    canal.subscribe((status) => {
      setConectado(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') agendar() // pega o que mudou enquanto estava desconectado
    })

    const intervalo = setInterval(recarregar, INTERVALO_SEGURANCA_MS)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') recarregar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', recarregar)

    return () => {
      clearTimeout(espera)
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', recarregar)
      supabase.removeChannel(canal)
    }
  }, [dataServico, recarregar])

  /** Aplica `otimista` na tela, executa `gravar`; se falhar, avisa e recarrega do banco. */
  const executar = useCallback(
    async (gravar: () => Promise<void>, otimista?: { dia?: (d: DadosDia) => DadosDia; cadastros?: (c: Cadastros) => Cadastros }) => {
      geracao.current++
      if (otimista?.dia) setDia((d) => (d ? otimista.dia!(d) : d))
      if (otimista?.cadastros) setCadastros((c) => (c ? otimista.cadastros!(c) : c))
      try {
        await gravar()
        return true
      } catch (e) {
        avisar(`Não foi possível salvar: ${mensagemErro(e)}`, 'erro')
        recarregar()
        return false
      }
    },
    [recarregar],
  )

  // ---------------------------------------------------------------------------
  // Dia de serviço
  // ---------------------------------------------------------------------------

  /** Grava um campo do checklist (sim/não, texto ou lista de ids). */
  const definirValor = useCallback(
    (chave: string, valor: unknown) =>
      executar(() => dados.salvarValor(dataServico, chave, valor), {
        dia: (d) => ({
          ...d,
          checklist: {
            ...d.checklist,
            [chave]: { data_servico: d.data, chave, valor, atualizado_em: new Date().toISOString(), atualizado_por: null },
          },
        }),
      }),
    [dataServico, executar],
  )

  const definirCondicao = useCallback(
    (militarId: string, campos: Partial<Pick<Condicao, 'status' | 'observacao'>>) => {
      // escalado no BRADO e ainda sem condição registrada: a primeira marcação cria a linha
      const criar = Boolean(dia && !dia.condicoes.some((c) => c.militar_id === militarId))
      return executar(() => dados.salvarCondicao(dataServico, militarId, campos, criar), {
        dia: (d) =>
          d.condicoes.some((c) => c.militar_id === militarId)
            ? { ...d, condicoes: d.condicoes.map((c) => (c.militar_id === militarId ? { ...c, ...campos } : c)) }
            : {
                ...d,
                condicoes: [
                  ...d.condicoes,
                  {
                    data_servico: d.data,
                    militar_id: militarId,
                    status: null,
                    observacao: null,
                    atualizado_em: new Date().toISOString(),
                    atualizado_por: null,
                    ...campos,
                  },
                ],
              },
      })
    },
    [dataServico, dia, executar],
  )

  /** Grava a escala lida do BRADO pela ponte (pode ser de outro dia que não o exibido). */
  const registrarEscalaBrado = useCallback(
    async (data: string, codLotacao: number, militares: MilitarBrado[], lidoEm: string) => {
      const ok = await executar(() => dados.registrarEscalaBrado(data, codLotacao, militares, lidoEm))
      if (ok) recarregar()
      return ok
    },
    [executar, recarregar],
  )

  const adicionarNaEquipe = useCallback(
    (militarIds: string[]) =>
      executar(() => dados.adicionarNaEquipe(dataServico, militarIds), {
        dia: (d) => {
          const presentes = new Set(d.condicoes.map((c) => c.militar_id))
          const novas: Condicao[] = militarIds
            .filter((id) => !presentes.has(id))
            .map((id) => ({
              data_servico: d.data,
              militar_id: id,
              status: null,
              observacao: null,
              atualizado_em: new Date().toISOString(),
              atualizado_por: null,
            }))
          return { ...d, condicoes: [...d.condicoes, ...novas] }
        },
      }),
    [dataServico, executar],
  )

  /** Tira o militar da equipe do dia e das funções/viaturas em que estava escalado. */
  const removerDaEquipe = useCallback(
    (militarId: string) => {
      const escalas = dia
        ? Object.keys(dia.checklist)
            .filter((chave) => chave.startsWith('guarnicao:') || chave.startsWith('viatura:'))
            .filter((chave) => valorIds(dia, chave).includes(militarId))
            .map((chave) => [chave, valorIds(dia, chave).filter((id) => id !== militarId)] as const)
        : []
      return executar(
        async () => {
          await dados.removerDaEquipe(dataServico, militarId)
          await Promise.all(escalas.map(([chave, ids]) => dados.salvarValor(dataServico, chave, ids)))
        },
        {
          dia: (d) => ({
            ...d,
            condicoes: d.condicoes.filter((c) => c.militar_id !== militarId),
            checklist: {
              ...d.checklist,
              ...Object.fromEntries(escalas.map(([chave, ids]) => [chave, { ...d.checklist[chave], valor: ids }])),
            },
          }),
        },
      )
    },
    [dataServico, dia, executar],
  )

  const criarOrdem = useCallback(
    async (campos: NovaOrdem, pdf?: File | null) => {
      const ok = await executar(() => dados.criarOrdem(dataServico, campos, pdf))
      if (ok) recarregar()
      return ok
    },
    [dataServico, executar, recarregar],
  )

  const excluirOrdem = useCallback(
    (ordem: OrdemMissao) =>
      executar(() => dados.excluirOrdem(ordem), {
        dia: (d) => ({ ...d, ordens: d.ordens.filter((o) => o.id !== ordem.id) }),
      }),
    [executar],
  )

  // ---------------------------------------------------------------------------
  // Cadastros
  // ---------------------------------------------------------------------------

  /** Cria (sem id) ou atualiza; com id, a mudança aparece na hora. */
  const salvarMilitar = useCallback(
    async (campos: Partial<dados.CamposMilitar> & { id?: string }, foto?: File | null) => {
      const ok = await executar(() => dados.salvarMilitar(campos, foto), {
        cadastros: campos.id
          ? (c) => ({ ...c, militares: c.militares.map((m): Militar => (m.id === campos.id ? { ...m, ...campos } : m)) })
          : undefined,
      })
      if (ok) recarregar()
      return ok
    },
    [executar, recarregar],
  )

  const salvarViatura = useCallback(
    async (campos: Partial<Omit<Viatura, 'id'>> & { id?: string }) => {
      const ok = await executar(() => dados.salvarViatura(campos), {
        cadastros: campos.id
          ? (c) => ({ ...c, viaturas: c.viaturas.map((v) => (v.id === campos.id ? { ...v, ...campos } : v)) })
          : undefined,
      })
      if (ok) recarregar()
      return ok
    },
    [executar, recarregar],
  )

  const excluirViatura = useCallback(
    (id: string) =>
      executar(() => dados.excluirViatura(id), {
        cadastros: (c) => ({ ...c, viaturas: c.viaturas.filter((v) => v.id !== id) }),
      }),
    [executar],
  )

  const salvarFuncao = useCallback(
    async (campos: Parameters<typeof dados.salvarFuncao>[0]) => {
      const ok = await executar(() => dados.salvarFuncao(campos), {
        cadastros: campos.id
          ? (c) => ({ ...c, funcoes: c.funcoes.map((f) => (f.id === campos.id ? { ...f, ...campos } : f)) })
          : undefined,
      })
      if (ok) recarregar()
      return ok
    },
    [executar, recarregar],
  )

  const excluirFuncao = useCallback(
    (id: string) =>
      executar(() => dados.excluirFuncao(id), {
        cadastros: (c) => ({ ...c, funcoes: c.funcoes.filter((f) => f.id !== id) }),
      }),
    [executar],
  )

  return {
    cadastros,
    dia,
    carregando: !cadastros || !dia,
    erro,
    conectado,
    sincronizadoEm,
    recarregar,
    definirValor,
    definirCondicao,
    adicionarNaEquipe,
    removerDaEquipe,
    registrarEscalaBrado,
    criarOrdem,
    excluirOrdem,
    salvarMilitar,
    salvarViatura,
    excluirViatura,
    salvarFuncao,
    excluirFuncao,
  }
}

export type Briefing = ReturnType<typeof useBriefing>
