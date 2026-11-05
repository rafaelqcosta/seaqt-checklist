import { CHAVES, SISTEMAS_CBMDF } from './constantes'
import type { Cadastros, Condicao, DadosDia, Funcao, Militar, StatusCondicao, Viatura } from './tipos'

/** true / false / null (não respondido). */
export function valorBool(dia: DadosDia, chave: string): boolean | null {
  const valor = dia.checklist[chave]?.valor
  return typeof valor === 'boolean' ? valor : null
}

export function valorTexto(dia: DadosDia, chave: string): string {
  const valor = dia.checklist[chave]?.valor
  return typeof valor === 'string' ? valor : ''
}

/** Lista de ids (militares escalados numa função ou condutores de uma viatura). */
export function valorIds(dia: DadosDia, chave: string): string[] {
  const valor = dia.checklist[chave]?.valor
  return Array.isArray(valor) ? valor.filter((id): id is string => typeof id === 'string') : []
}

/** Ativa = pronta para emprego (cadastro). Em serviço = escalada no dia; viatura inativa nunca está em serviço. */
export function emServico(dia: DadosDia, viatura: Viatura): boolean {
  return viatura.ativa && valorBool(dia, CHAVES.viaturaServico(viatura.id)) === true
}

/**
 * Militares da equipe do dia, na ordem hierárquica, com o status de cada um.
 * Entram os escalados no BRADO e os incluídos no SEAQT; quem só veio do BRADO
 * aparece com condição ainda não informada.
 */
export function equipeDoDia(dia: DadosDia, cadastros: Cadastros) {
  const condicaoPorMilitar = new Map(dia.condicoes.map((c) => [c.militar_id, c]))
  const bradoPorMilitar = new Map(dia.escalaBrado.map((e) => [e.militar_id, e]))
  return cadastros.militares
    .filter((m) => condicaoPorMilitar.has(m.id) || bradoPorMilitar.has(m.id))
    .map((militar) => ({
      militar,
      condicao: condicaoPorMilitar.get(militar.id) ?? condicaoNaoInformada(dia.data, militar.id),
      brado: bradoPorMilitar.get(militar.id),
      // no BRADO, escala com turno de 12h (08h–20h ou 20h–08h) = Gratificação de Serviço Voluntário
      gsv: Boolean(bradoPorMilitar.get(militar.id)?.turno),
    }))
}

function condicaoNaoInformada(data: string, militarId: string): Condicao {
  return { data_servico: data, militar_id: militarId, status: null, observacao: null, atualizado_em: '', atualizado_por: null }
}

/** undefined = fora da equipe do dia. */
export function statusDoMilitar(dia: DadosDia, militarId: string): StatusCondicao | null | undefined {
  const condicao = dia.condicoes.find((c) => c.militar_id === militarId)
  if (condicao) return condicao.status
  return dia.escalaBrado.some((e) => e.militar_id === militarId) ? null : undefined
}

/** Funções ativas com os militares escalados (ids desconhecidos são ignorados). */
export function guarnicaoDoDia(dia: DadosDia, cadastros: Cadastros): { funcao: Funcao; militares: Militar[] }[] {
  const porId = new Map(cadastros.militares.map((m) => [m.id, m]))
  return cadastros.funcoes
    .filter((f) => f.ativa)
    .map((funcao) => ({
      funcao,
      militares: valorIds(dia, CHAVES.guarnicao(funcao.id))
        .map((id) => porId.get(id))
        .filter((m): m is Militar => Boolean(m)),
    }))
}

// ---------------------------------------------------------------------------
// Resumo de progresso do briefing (mesma regra na TV e no celular)
// ---------------------------------------------------------------------------

/** ok = respondido e positivo · alerta = respondido com problema · pendente = falta responder */
export type EstadoSecao = 'ok' | 'alerta' | 'pendente'

export type SecaoId = 'pessoal' | 'guarnicao' | 'hiperbarica' | 'material' | 'sistemas' | 'incendio'

export interface ResumoSecao {
  id: SecaoId
  titulo: string
  estado: EstadoSecao
  detalhe: string
}

function estadoSimNao(valor: boolean | null): EstadoSecao {
  return valor === null ? 'pendente' : valor ? 'ok' : 'alerta'
}

export function resumoBriefing(dia: DadosDia, cadastros: Cadastros): ResumoSecao[] {
  const equipe = equipeDoDia(dia, cadastros)
  const semInformar = equipe.filter((e) => e.condicao.status === null).length
  const inaptos = equipe.filter((e) => e.condicao.status === 'inapto').length
  const ausentes = equipe.filter((e) => e.condicao.status === 'ausente').length
  const aptos = equipe.filter((e) => e.condicao.status === 'apto').length

  const pessoal: ResumoSecao = {
    id: 'pessoal',
    titulo: 'Condição do pessoal',
    estado: equipe.length === 0 || semInformar > 0 ? 'pendente' : inaptos + ausentes > 0 ? 'alerta' : 'ok',
    detalhe:
      equipe.length === 0
        ? 'Equipe do dia não definida'
        : semInformar > 0
          ? `${semInformar} sem informação`
          : [`${aptos} apto${aptos === 1 ? '' : 's'}`, inaptos && `${inaptos} inapto${inaptos === 1 ? '' : 's'}`, ausentes && `${ausentes} ausente${ausentes === 1 ? '' : 's'}`]
              .filter(Boolean)
              .join(' · '),
  }

  const guarnicao = guarnicaoDoDia(dia, cadastros)
  const preenchidas = guarnicao.filter((g) => g.militares.length > 0).length
  const escaladoSemCondicao = guarnicao.some((g) =>
    g.militares.some((m) => {
      const status = statusDoMilitar(dia, m.id)
      return status === 'inapto' || status === 'ausente'
    }),
  )
  const resumoGuarnicao: ResumoSecao = {
    id: 'guarnicao',
    titulo: 'Divisão das guarnições',
    estado: preenchidas === 0 ? 'pendente' : escaladoSemCondicao ? 'alerta' : 'ok',
    detalhe: escaladoSemCondicao
      ? 'Militar inapto/ausente escalado'
      : `${preenchidas}/${guarnicao.length} funções preenchidas`,
  }

  const contato = valorBool(dia, CHAVES.hiperbaricaContato)
  const hospital = valorTexto(dia, CHAVES.hiperbaricaHospital)
  const hiperbarica: ResumoSecao = {
    id: 'hiperbarica',
    titulo: 'Contato com a hiperbárica',
    estado: estadoSimNao(contato),
    detalhe: contato === null ? 'Não informado' : contato ? `Contato realizado${hospital ? ` · ${hospital}` : ''}` : 'Contato não realizado',
  }

  const grifo = valorBool(dia, CHAVES.materialGrifo)
  const material: ResumoSecao = {
    id: 'material',
    titulo: 'Material operacional',
    estado: estadoSimNao(grifo),
    detalhe: grifo === null ? 'Não informado' : grifo ? 'Conferido pelo GRIFO' : 'Não conferido pelo GRIFO',
  }

  const sistemasOk = SISTEMAS_CBMDF.filter((s) => valorBool(dia, s.chave) === true).length
  const sistemas: ResumoSecao = {
    id: 'sistemas',
    titulo: 'Sistemas CBMDF',
    estado: sistemasOk === SISTEMAS_CBMDF.length ? 'ok' : 'pendente',
    detalhe: `${sistemasOk}/${SISTEMAS_CBMDF.length} conferidos`,
  }

  const operacional = valorBool(dia, CHAVES.incendioOperacional)
  const incendio: ResumoSecao = {
    id: 'incendio',
    titulo: 'Combate a incêndio',
    estado: estadoSimNao(operacional),
    detalhe: operacional === null ? 'Não informado' : operacional ? 'Operacional' : 'Inoperante',
  }

  return [pessoal, resumoGuarnicao, hiperbarica, material, sistemas, incendio]
}

/** Quantas seções já foram respondidas (ok ou alerta). */
export function progresso(resumo: ResumoSecao[]): { feitas: number; total: number } {
  return { feitas: resumo.filter((s) => s.estado !== 'pendente').length, total: resumo.length }
}
