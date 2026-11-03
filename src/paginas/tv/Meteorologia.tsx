import { CloudSun, Droplets, Sun, TriangleAlert, Umbrella, Wind, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconeTempo } from '../../components/IconeTempo'
import { LOCAL_METEO } from '../../lib/constantes'
import { formatarHorario } from '../../lib/datas'
import { descricaoTempo, direcaoCardinal, iconeTempo, severidade, type Meteo } from '../../lib/meteo'
import { Quadro } from './Quadro'

export function Meteorologia({ meteo, erro }: { meteo: Meteo | null; erro: boolean }) {
  return (
    <Quadro
      titulo="Meteorologia"
      Icone={CloudSun}
      className="shrink-0"
      extra={
        <span className="shrink-0 text-sm text-slate-500">
          {LOCAL_METEO.nome}
          {meteo && ` · ${formatarHorario(meteo.medidoEm.slice(11))}`}
        </span>
      }
    >
      {meteo ? (
        <Previsao meteo={meteo} />
      ) : (
        <p className="py-8 text-center text-xl text-slate-400">{erro ? 'Meteorologia indisponível' : 'Carregando…'}</p>
      )}
    </Quadro>
  )
}

function Previsao({ meteo }: { meteo: Meteo }) {
  const nivel = severidade(meteo)
  return (
    <>
      {nivel !== 'normal' && (
        <div
          className={`mb-3 flex items-center gap-2.5 rounded-xl px-4 py-2 text-xl font-extrabold tracking-wide uppercase ${
            nivel === 'perigo' ? 'bg-red-600 text-white' : 'bg-amber-400 text-amber-950'
          }`}
        >
          <TriangleAlert className="size-6 shrink-0" />
          {nivel === 'perigo' ? 'Trovoada na região' : meteo.rajada >= 40 ? 'Rajadas fortes' : 'Chuva forte'}
        </div>
      )}

      <div className="flex items-center gap-4">
        <IconeTempo tipo={iconeTempo(meteo.codigo, meteo.ehDia)} strokeWidth={1.5} className="size-[4.5rem] shrink-0 text-marinho-600" />
        <div className="text-6xl leading-none font-extrabold tabular-nums">{Math.round(meteo.temperatura)}°</div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="line-clamp-2 text-xl font-semibold">{descricaoTempo(meteo.codigo)}</div>
          {meteo.maxima !== null && meteo.minima !== null && (
            <div className="mt-1 text-base text-slate-500">
              Máx {Math.round(meteo.maxima)}° · Mín {Math.round(meteo.minima)}°
            </div>
          )}
        </div>
      </div>

      <dl className="mt-3 divide-y divide-slate-100">
        <Linha Icone={Wind} rotulo="Vento">
          {Math.round(meteo.vento)} km/h {direcaoCardinal(meteo.direcaoVento)}
          <span className="ml-1.5 text-base font-medium text-slate-500">rajada {Math.round(meteo.rajada)}</span>
        </Linha>
        <Linha Icone={Droplets} rotulo="Umidade">
          {Math.round(meteo.umidade)}%
        </Linha>
        <Linha Icone={Umbrella} rotulo="Chuva em 3h">
          {meteo.chuvaProximasHoras === null ? '—' : `${meteo.chuvaProximasHoras}%`}
        </Linha>
        <Linha Icone={Sun} rotulo="Índice UV">
          {meteo.uv === null ? '—' : Math.round(meteo.uv)}
        </Linha>
      </dl>
    </>
  )
}

function Linha({ Icone, rotulo, children }: { Icone: LucideIcon; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 leading-tight">
      <dt className="flex items-center gap-2 text-lg text-slate-500">
        <Icone className="size-5 shrink-0" />
        {rotulo}
      </dt>
      <dd className="text-xl font-bold whitespace-nowrap tabular-nums">{children}</dd>
    </div>
  )
}
