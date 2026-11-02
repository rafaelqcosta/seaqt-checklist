import { CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react'
import type { EstadoSecao } from '../lib/checklist'
import type { StatusCondicao } from '../lib/tipos'

export const ROTULO_STATUS: Record<StatusCondicao, string> = {
  apto: 'Apto',
  inapto: 'Inapto',
  ausente: 'Ausente',
}

/** Classes do chip de condição (fundo claro). */
export const ESTILO_STATUS: Record<StatusCondicao | 'pendente', string> = {
  apto: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  inapto: 'border-red-200 bg-red-50 text-cbm-700',
  ausente: 'border-slate-200 bg-slate-100 text-slate-600',
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function ChipStatus({ status }: { status: StatusCondicao | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ESTILO_STATUS[status ?? 'pendente']}`}
    >
      {status ? ROTULO_STATUS[status] : 'Não informado'}
    </span>
  )
}

/** Ícone de estado de uma seção do checklist. */
export function IconeEstado({ estado, className = 'size-5' }: { estado: EstadoSecao; className?: string }) {
  if (estado === 'ok') return <CircleCheck aria-label="Concluído" className={`text-emerald-600 ${className}`} />
  if (estado === 'alerta') return <TriangleAlert aria-label="Atenção" className={`text-cbm-700 ${className}`} />
  return <CircleDashed aria-label="Pendente" className={`text-amber-500 ${className}`} />
}
