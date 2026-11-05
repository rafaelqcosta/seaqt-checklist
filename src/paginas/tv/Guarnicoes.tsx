import { Anchor, TriangleAlert } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { useUrlsAssinadas } from '../../lib/arquivos'
import { statusDoMilitar, type guarnicaoDoDia } from '../../lib/checklist'
import { nomeMilitar } from '../../lib/militares'
import type { DadosDia } from '../../lib/tipos'
import { Quadro, Vazio } from './Quadro'

interface Props {
  dia: DadosDia
  guarnicao: ReturnType<typeof guarnicaoDoDia>
}

export function Guarnicoes({ dia, guarnicao }: Props) {
  const urls = useUrlsAssinadas(guarnicao.flatMap(({ militares }) => militares.map((militar) => militar.foto_path)))
  return (
    <Quadro titulo="Guarnições" Icone={Anchor}>
      {guarnicao.length === 0 ? (
        <Vazio>Nenhuma função ativa</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {guarnicao.map(({ funcao, militares }) => (
            <li key={funcao.id} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-[0.9375rem] leading-tight font-bold tracking-wider text-marinho-700 uppercase">{funcao.nome}</div>
              {militares.length === 0 ? (
                <div className="mt-1 text-[1.375rem] leading-tight text-slate-300">—</div>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {militares.map((militar) => {
                    const status = statusDoMilitar(dia, militar.id)
                    return (
                      <li key={militar.id} className="flex items-center gap-2.5">
                        <Avatar
                          militar={militar}
                          url={militar.foto_path ? urls[militar.foto_path] : undefined}
                          className="size-8 rounded-full text-xs"
                        />
                        <span className="min-w-0 truncate text-[1.375rem] leading-tight font-semibold">{nomeMilitar(militar)}</span>
                        {(status === 'inapto' || status === 'ausente') && (
                          <TriangleAlert aria-label={status} className="size-5 shrink-0 text-cbm-600" />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Quadro>
  )
}
