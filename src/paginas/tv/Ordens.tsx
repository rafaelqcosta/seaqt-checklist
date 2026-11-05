import { ClipboardList, FileText, MapPin } from 'lucide-react'
import { formatarHorario } from '../../lib/datas'
import type { OrdemMissao } from '../../lib/tipos'
import { Quadro, Vazio } from './Quadro'

export function Ordens({ ordens }: { ordens: OrdemMissao[] }) {
  return (
    <Quadro titulo="Ordens de missão" Icone={ClipboardList}>
      {ordens.length === 0 ? (
        <Vazio>Nenhuma OM para hoje</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordens.map((ordem) => (
            <li key={ordem.id} className="flex items-center gap-4 rounded-xl bg-slate-50 px-3 py-2">
              <span className="w-[4.75rem] shrink-0 text-[1.375rem] font-extrabold text-marinho-700 tabular-nums">
                {formatarHorario(ordem.horario) || '—'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[1.375rem] leading-tight font-semibold">{ordem.titulo}</div>
                {(ordem.local || ordem.arquivo_path) && (
                  <div className="flex items-center gap-3 text-base text-slate-500">
                    {ordem.local && (
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-4 shrink-0" />
                        <span className="truncate">{ordem.local}</span>
                      </span>
                    )}
                    {ordem.arquivo_path && (
                      <span className="flex shrink-0 items-center gap-1 font-semibold text-slate-600">
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
    </Quadro>
  )
}
