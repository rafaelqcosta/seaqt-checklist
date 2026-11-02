import { ClipboardList, FileText, MapPin } from 'lucide-react'
import { formatarHorario } from '../../lib/datas'
import type { OrdemMissao } from '../../lib/tipos'
import { limitar, Mais, Quadro, Vazio } from './Quadro'

const MAXIMO_ORDENS = 5

export function Ordens({ ordens }: { ordens: OrdemMissao[] }) {
  const { visiveis, restantes } = limitar(ordens, MAXIMO_ORDENS)
  return (
    <Quadro titulo="Ordens de missão" Icone={ClipboardList}>
      {ordens.length === 0 ? (
        <Vazio>Nenhuma OM para hoje</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((ordem) => (
            <li key={ordem.id} className="flex items-center gap-4 rounded-xl bg-white/5 px-3 py-2">
              <span className="w-[5.25rem] shrink-0 text-2xl font-extrabold text-sky-300 tabular-nums">
                {formatarHorario(ordem.horario) || '—'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl leading-tight font-semibold">{ordem.titulo}</div>
                {(ordem.local || ordem.arquivo_path) && (
                  <div className="flex items-center gap-3 text-base text-slate-400">
                    {ordem.local && (
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-4 shrink-0" />
                        <span className="truncate">{ordem.local}</span>
                      </span>
                    )}
                    {ordem.arquivo_path && (
                      <span className="flex shrink-0 items-center gap-1 font-semibold text-slate-300">
                        <FileText className="size-4" />
                        PDF
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Mais restantes={restantes} />
    </Quadro>
  )
}
