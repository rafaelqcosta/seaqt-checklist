import { Anchor, TriangleAlert } from 'lucide-react'
import { statusDoMilitar, type guarnicaoDoDia } from '../../lib/checklist'
import { nomeMilitar } from '../../lib/militares'
import type { DadosDia } from '../../lib/tipos'
import { limitar, Mais, Quadro, Vazio } from './Quadro'

const MAXIMO_FUNCOES = 7

interface Props {
  dia: DadosDia
  guarnicao: ReturnType<typeof guarnicaoDoDia>
}

export function Guarnicoes({ dia, guarnicao }: Props) {
  const { visiveis, restantes } = limitar(guarnicao, MAXIMO_FUNCOES)
  return (
    <Quadro titulo="Guarnições" Icone={Anchor}>
      {guarnicao.length === 0 ? (
        <Vazio>Nenhuma função ativa</Vazio>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visiveis.map(({ funcao, militares }) => (
            <li key={funcao.id} className="min-w-0 leading-tight">
              <div className="truncate text-base font-bold tracking-wider text-sky-300/80 uppercase">{funcao.nome}</div>
              {militares.length === 0 ? (
                <div className="text-2xl text-slate-600">—</div>
              ) : (
                <div className="truncate text-2xl font-semibold">
                  {militares.map((militar, indice) => {
                    const status = statusDoMilitar(dia, militar.id)
                    return (
                      <span key={militar.id}>
                        {indice === 0 ? '' : indice === militares.length - 1 ? ' e ' : ', '}
                        {nomeMilitar(militar)}
                        {(status === 'inapto' || status === 'ausente') && (
                          <TriangleAlert aria-label={status} className="ml-1.5 inline-block size-6 text-red-500" />
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
      <Mais restantes={restantes} />
    </Quadro>
  )
}
