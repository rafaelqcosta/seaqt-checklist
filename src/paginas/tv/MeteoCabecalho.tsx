import { TriangleAlert } from 'lucide-react'
import { IconeTempo } from '../../components/IconeTempo'
import { descricaoTempo, iconeTempo, severidade, type Meteo, type TipoIconeTempo } from '../../lib/meteo'

/** De 2 em 2 horas, 6 pontos (próximas 12 horas). */
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

/** Meteorologia compacta para o cabeçalho da TV: agora + próximas horas. */
export function MeteoCabecalho({ meteo, erro }: { meteo: Meteo | null; erro: boolean }) {
  if (!meteo) return <span className="text-base text-slate-400">{erro ? 'Meteorologia indisponível' : 'Carregando tempo…'}</span>

  const nivel = severidade(meteo)
  const tipoAgora = iconeTempo(meteo.codigo, meteo.ehDia)
  const alerta = nivel === 'perigo' ? 'Trovoada na região' : meteo.rajada >= 40 ? 'Rajadas fortes' : 'Chuva forte'
  const pontos = meteo.proximasHoras.filter((_, indice) => indice % PASSO_HORAS === 0)

  return (
    <div className="flex items-center gap-6">
      <div
        className={`flex items-center gap-3 rounded-xl px-3 py-1 ${
          nivel === 'perigo' ? 'bg-red-600 text-white' : nivel === 'atencao' ? 'bg-amber-400 text-amber-950' : ''
        }`}
      >
        <IconeTempo
          tipo={tipoAgora}
          strokeWidth={1.75}
          className={`size-11 shrink-0 ${nivel === 'normal' ? COR_ICONE[tipoAgora] : ''}`}
        />
        <span className="text-4xl leading-none font-extrabold tabular-nums">{Math.round(meteo.temperatura)}°</span>
        <div className="leading-tight">
          {nivel === 'normal' ? (
            <div className="text-base font-semibold">{descricaoTempo(meteo.codigo)}</div>
          ) : (
            <div className="flex items-center gap-1 text-base font-extrabold uppercase">
              <TriangleAlert className="size-4 shrink-0" />
              {alerta}
            </div>
          )}
          {meteo.maxima !== null && meteo.minima !== null && (
            <div className={`text-xs ${nivel === 'normal' ? 'text-slate-500' : ''}`}>
              Máx {Math.round(meteo.maxima)}° · Mín {Math.round(meteo.minima)}°
            </div>
          )}
        </div>
      </div>

      {pontos.length > 0 && (
        <ol className="flex gap-3">
          {pontos.map((ponto) => {
            const tipo = iconeTempo(ponto.codigo, ponto.ehDia)
            return (
              <li key={ponto.hora} className="flex w-9 flex-col items-center leading-none">
                <span className="text-xs text-slate-500 tabular-nums">{ponto.hora.slice(11, 13)}h</span>
                <IconeTempo tipo={tipo} strokeWidth={2} className={`mt-1 size-6 ${COR_ICONE[tipo]}`} />
                <span className="mt-1 text-sm font-bold tabular-nums">{Math.round(ponto.temperatura)}°</span>
                {ponto.chuva !== null && (
                  <span className={`mt-0.5 text-xs font-semibold tabular-nums ${ponto.chuva >= 50 ? 'text-blue-700' : 'text-slate-400'}`}>
                    {ponto.chuva}%
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
