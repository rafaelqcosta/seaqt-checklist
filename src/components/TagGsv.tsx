import { Moon, Sun } from 'lucide-react'
import type { TurnoGsv } from '../lib/checklist'

interface Props {
  turno: TurnoGsv
  /** Tamanho do texto, espaçamento e arredondamento. */
  className: string
  /** Tamanho do ícone. */
  classeIcone: string
}

/** Tag laranja de Gratificação de Serviço Voluntário, com sol (diurna) ou lua (noturna). */
export function TagGsv({ turno, className, classeIcone }: Props) {
  const Icone = turno === 'noturno' ? Moon : Sun
  return (
    <span
      title={turno === 'noturno' ? 'GSV noturna' : 'GSV diurna'}
      className={`flex shrink-0 items-center gap-1 bg-orange-500 leading-none font-extrabold tracking-wide text-white ${className}`}
    >
      <Icone aria-hidden className={`shrink-0 ${classeIcone}`} strokeWidth={2.5} />
      GSV
    </span>
  )
}
