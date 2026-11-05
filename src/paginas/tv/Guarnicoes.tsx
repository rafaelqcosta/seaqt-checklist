import { Anchor, TriangleAlert } from 'lucide-react'
import { statusDoMilitar, type guarnicaoDoDia } from '../../lib/checklist'
import { nomeMilitar } from '../../lib/militares'
import type { DadosDia } from '../../lib/tipos'
import { Quadro, Vazio } from './Quadro'

interface Props {
  dia: DadosDia
  guarnicao: ReturnType<typeof guarnicaoDoDia>
}

export function Guarnicoes({ dia, guarnicao }: Props) {
  return (
    <Quadro titulo="Guarnições" Icone={Anchor}>
      {guarnicao.length === 0 ? (
        <Vazio>Nenhuma função ativa</Vazio>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {guarnicao.map(({ funcao, militares }) => (
            <li key={funcao.id} className="min-w-0 leading-tight">
              <div className="text-[0.9375rem] font-bold tracking-wider text-marinho-700 uppercase">{funcao.nome}</div>
              {militares.length === 0 ? (
                <div className="text-[1.375rem] text-slate-300">—</div>
              ) : (
                <div className="text-[1.375rem] font-semibold">
                  {militares.map((militar, indice) => {
                    const status = statusDoMilitar(dia, militar.id)
                    return (
                      <span key={militar.id}>
                        {indice === 0 ? '' : indice === militares.length - 1 ? ' e ' : ', '}
                        {nomeMilitar(militar)}
                        {(status === 'inapto' || status === 'ausente') && (
                          <TriangleAlert aria-label={status} className="ml-1.5 inline-block size-5 text-cbm-600" />
                        )}
                      </span>
                    )
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Quadro>
  )
}
