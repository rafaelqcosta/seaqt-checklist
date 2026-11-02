import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { progresso, type ResumoSecao } from '../../lib/checklist'
import { formatarData, somarDias } from '../../lib/datas'

interface Props {
  data: string
  hoje: string
  onMudar: (data: string) => void
  /** null enquanto carrega. */
  resumo: ResumoSecao[] | null
  conectado: boolean
}

/** Linha fixa sob a barra do topo: navegação de data, progresso do checklist e estado do tempo real. */
export function BarraData({ data, hoje, onMudar, resumo, conectado }: Props) {
  const ehHoje = data === hoje
  const { feitas, total } = progresso(resumo ?? [])
  const completo = total > 0 && feitas === total

  return (
    <div className="border-t border-slate-100">
      <div className="mx-auto max-w-3xl px-4 pt-1 pb-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMudar(somarDias(data, -1))}
            aria-label="Dia anterior"
            className="botao w-11 shrink-0 px-0 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* o input de data fica invisível por cima do texto: o toque abre o seletor nativo */}
          <label className="relative flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 hover:bg-slate-100">
            <CalendarDays className="size-5 shrink-0 text-marinho-700" />
            <span className="truncate font-bold text-slate-900 capitalize">{formatarData(data)}</span>
            {ehHoje && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Hoje</span>
            )}
            <input
              type="date"
              value={data}
              onChange={(e) => e.target.value && onMudar(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              aria-label="Escolher a data do serviço"
              className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
            />
          </label>

          <button
            type="button"
            onClick={() => onMudar(somarDias(data, 1))}
            aria-label="Dia seguinte"
            className="botao w-11 shrink-0 px-0 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="size-6" />
          </button>
          {!ehHoje && (
            <button type="button" onClick={() => onMudar(hoje)} className="botao-secundario shrink-0 px-3">
              Hoje
            </button>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="shrink-0">
            Checklist <span className="text-slate-900 tabular-nums">{resumo ? `${feitas}/${total}` : '…'}</span>
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Progresso do checklist"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={feitas}
          >
            <div
              className={`h-full rounded-full transition-all ${completo ? 'bg-emerald-500' : 'bg-marinho-600'}`}
              style={{ width: total ? `${(feitas / total) * 100}%` : 0 }}
            />
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className={`size-2 rounded-full ${conectado ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'}`} />
            {conectado ? 'Ao vivo' : 'Reconectando…'}
          </span>
        </div>
      </div>
    </div>
  )
}
