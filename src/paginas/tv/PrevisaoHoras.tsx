import { ChartColumn } from 'lucide-react'
import { IconeTempo } from '../../components/IconeTempo'
import { iconeTempo, type PrevisaoHora, type TipoIconeTempo } from '../../lib/meteo'
import { Quadro } from './Quadro'

/** De 2 em 2 horas para caber na coluna da TV. */
const PASSO_HORAS = 2

const COR_ICONE: Record<TipoIconeTempo, string> = {
  sol: 'text-amber-500',
  'sol-nuvem': 'text-amber-500',
  lua: 'text-indigo-400',
  'lua-nuvem': 'text-indigo-400',
  nuvem: 'text-slate-400',
  nevoeiro: 'text-slate-400',
  garoa: 'text-sky-500',
  chuva: 'text-blue-600',
  trovoada: 'text-violet-600',
  neve: 'text-sky-300',
}

/** Previsão das próximas horas: ícone colorido (sol/chuva), temperatura e barra de chance de chuva. */
export function PrevisaoHoras({ horas }: { horas: PrevisaoHora[] }) {
  const pontos = horas.filter((_, indice) => indice % PASSO_HORAS === 0)
  return (
    <Quadro titulo="Próximas horas" Icone={ChartColumn} className="shrink-0">
      <ol className="flex">
        {pontos.map((ponto) => {
          const tipo = iconeTempo(ponto.codigo, ponto.ehDia)
          const chuva = ponto.chuva ?? 0
          return (
            <li key={ponto.hora} className="flex min-w-0 flex-1 flex-col items-center leading-none">
              <span className="text-sm font-semibold text-slate-500 tabular-nums">{ponto.hora.slice(11, 13)}h</span>
              <IconeTempo tipo={tipo} strokeWidth={2} className={`mt-1.5 size-8 ${COR_ICONE[tipo]}`} />
              <span className="mt-1.5 text-lg font-bold tabular-nums">{Math.round(ponto.temperatura)}°</span>
              <div className="mt-2 flex h-12 w-5 items-end overflow-hidden rounded-md bg-amber-100">
                <div className="w-full rounded-md bg-blue-500" style={{ height: `${chuva}%` }} />
              </div>
              <span className={`mt-1 text-sm font-semibold tabular-nums ${chuva >= 50 ? 'text-blue-700' : 'text-slate-500'}`}>
                {ponto.chuva === null ? '—' : `${chuva}%`}
              </span>
            </li>
          )
        })}
      </ol>
    </Quadro>
  )
}
