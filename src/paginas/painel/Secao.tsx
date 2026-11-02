import { ChevronRight, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { ChipStatus, IconeEstado, ROTULO_STATUS } from '../../components/Estado'
import type { Briefing } from '../../hooks/useBriefing'
import { statusDoMilitar, type EstadoSecao, type ResumoSecao } from '../../lib/checklist'
import { formatarHora } from '../../lib/datas'
import { nomeMilitar } from '../../lib/militares'
import type { Cadastros, DadosDia, ItemChecklist, Militar } from '../../lib/tipos'

/** O que toda seção do painel recebe (dia e cadastros já carregados). */
export interface PropsSecao {
  briefing: Briefing
  dia: DadosDia
  cadastros: Cadastros
  resumo?: ResumoSecao
}

const COR_DETALHE: Record<EstadoSecao, string> = {
  ok: 'text-emerald-700',
  alerta: 'text-cbm-700',
  pendente: 'text-amber-700',
}

interface SecaoProps {
  numero: number
  titulo: string
  /** Estado e detalhe do resumo do briefing; seções fora dele passam só `detalhe`. */
  resumo?: ResumoSecao
  detalhe?: string
  children: ReactNode
}

export function Secao({ numero, titulo, resumo, detalhe, children }: SecaoProps) {
  const texto = detalhe ?? resumo?.detalhe
  return (
    <section className="cartao" aria-label={titulo}>
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-marinho-50 text-base font-extrabold text-marinho-700">
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="leading-tight font-bold text-slate-900">{titulo}</h2>
          {texto && (
            <p className={`mt-0.5 truncate text-sm font-medium ${resumo ? COR_DETALHE[resumo.estado] : 'text-slate-500'}`}>
              {texto}
            </p>
          )}
        </div>
        {resumo && <IconeEstado estado={resumo.estado} className="size-6 shrink-0" />}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

/** "por fulano@… às HH:MM" de quem respondeu por último (null logo após gravar, até o Realtime trazer o e-mail). */
export function textoAutoria(item: ItemChecklist | undefined): string | null {
  if (!item) return null
  return `${item.atualizado_por ? `por ${item.atualizado_por}` : 'Atualizado'} às ${formatarHora(item.atualizado_em)}`
}

export function Autoria({ item }: { item?: ItemChecklist }) {
  const texto = textoAutoria(item)
  return texto && <p className="mt-1.5 truncate text-xs text-slate-500">{texto}</p>
}

export function LinkCadastros({ children }: { children: ReactNode }) {
  return (
    <a href="#/cadastros" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-marinho-700 hover:underline">
      {children}
      <ChevronRight className="size-4" />
    </a>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600">
      {children}
    </div>
  )
}

/** Chips dos militares escalados; vermelho (com o motivo) se estiver inapto ou ausente. */
export function ChipsMilitares({ militares, dia }: { militares: Militar[]; dia: DadosDia }) {
  if (militares.length === 0) return <p className="text-sm text-slate-400">Ninguém escalado</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {militares.map((militar) => {
        const status = statusDoMilitar(dia, militar.id)
        const problema = status === 'inapto' || status === 'ausente' ? status : null
        return (
          <li
            key={militar.id}
            className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-semibold ${
              problema ? 'border-red-200 bg-red-50 text-cbm-700' : 'border-marinho-100 bg-marinho-50 text-marinho-700'
            }`}
          >
            {problema && <TriangleAlert className="size-3.5 shrink-0" />}
            <span className="truncate">{nomeMilitar(militar)}</span>
            {problema && <span className="shrink-0 font-medium">· {ROTULO_STATUS[problema]}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/** Condição do militar no seletor de escala (guarnições e condutores). */
export function detalheCondicao(dia: DadosDia) {
  return (militar: Militar) => <ChipStatus status={statusDoMilitar(dia, militar.id) ?? null} />
}
