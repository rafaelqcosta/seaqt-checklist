import type { BASES } from './constantes'

export type Base = (typeof BASES)[number]
export type StatusCondicao = 'apto' | 'inapto' | 'ausente'

export interface Militar {
  id: string
  posto_graduacao: string
  nome_guerra: string
  matricula: string | null
  foto_path: string | null
  ativo: boolean
}

export interface Viatura {
  id: string
  prefixo: string
  descricao: string | null
  base: Base
  ativa: boolean
  ordem: number
}

export interface Funcao {
  id: string
  nome: string
  ordem: number
  ativa: boolean
}

/** Linha existe = militar está na equipe do dia. status null = ainda não informado. */
export interface Condicao {
  data_servico: string
  militar_id: string
  status: StatusCondicao | null
  observacao: string | null
  atualizado_em: string
  atualizado_por: string | null
}

export interface ItemChecklist {
  data_servico: string
  chave: string
  valor: unknown
  atualizado_em: string
  atualizado_por: string | null
}

export interface OrdemMissao {
  id: string
  data_servico: string
  titulo: string
  /** 'HH:MM:SS' */
  horario: string | null
  local: string | null
  arquivo_path: string | null
  arquivo_nome: string | null
  atualizado_em: string
  atualizado_por: string | null
}

export interface Cadastros {
  /** Todos (ativos e inativos), ordenados por posto e nome. */
  militares: Militar[]
  /** Todas, ordenadas por ordem e prefixo. */
  viaturas: Viatura[]
  /** Todas, ordenadas por ordem. */
  funcoes: Funcao[]
}

export interface DadosDia {
  data: string
  condicoes: Condicao[]
  /** Respostas do checklist indexadas pela chave. */
  checklist: Record<string, ItemChecklist>
  /** Ordenadas por horário (sem horário por último). */
  ordens: OrdemMissao[]
}

export interface NovaOrdem {
  titulo: string
  horario: string | null
  local: string | null
}
