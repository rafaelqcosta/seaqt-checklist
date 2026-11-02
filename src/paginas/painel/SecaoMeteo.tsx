import { Droplets, Sun, TriangleAlert, Umbrella, Wind, type LucideIcon } from 'lucide-react'
import { IconeTempo } from '../../components/IconeTempo'
import { LOCAL_METEO } from '../../lib/constantes'
import { descricaoTempo, direcaoCardinal, iconeTempo, severidade, type Meteo } from '../../lib/meteo'
import { Secao } from './Secao'

/** Faixa de alerta para a operação na água (null = tempo normal). */
function alertaTempo(meteo: Meteo): { texto: string; classe: string } | null {
  const nivel = severidade(meteo)
  if (nivel === 'perigo') return { texto: 'Trovoada na região', classe: 'bg-cbm-700 text-white' }
  if (nivel === 'atencao') {
    return { texto: [65, 82].includes(meteo.codigo) ? 'Chuva forte' : 'Rajadas fortes', classe: 'bg-amber-100 text-amber-800' }
  }
  return null
}

function Dado({ Icone, rotulo, valor, extra }: { Icone: LucideIcon; rotulo: string; valor: string; extra?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="flex items-center gap-1 text-xs font-semibold text-slate-500">
        <Icone className="size-3.5" />
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-bold text-slate-900 tabular-nums">{valor}</dd>
      {extra && <dd className="text-xs text-slate-500">{extra}</dd>}
    </div>
  )
}

const graus = (valor: number | null) => (valor === null ? '—' : `${Math.round(valor)}°`)

/** Só leitura; `useMeteo` fica no Painel para não buscar de novo a cada troca de data. */
export function SecaoMeteo({ meteo, erro }: { meteo: Meteo | null; erro: boolean }) {
  const alerta = meteo && alertaTempo(meteo)

  return (
    <Secao numero={3} titulo={`Meteorologia · ${LOCAL_METEO.nome}`} detalhe={meteo ? descricaoTempo(meteo.codigo) : undefined}>
      {!meteo ? (
        <p className="text-sm text-slate-500">{erro ? 'Meteorologia indisponível no momento.' : 'Carregando meteorologia…'}</p>
      ) : (
        <>
          {alerta && (
            <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${alerta.classe}`}>
              <TriangleAlert className="size-5 shrink-0" />
              {alerta.texto}
            </div>
          )}

          <div className="flex items-center gap-4">
            <IconeTempo tipo={iconeTempo(meteo.codigo, meteo.ehDia)} className="size-14 shrink-0 text-marinho-700" strokeWidth={1.5} />
            <div>
              <p className="text-4xl leading-none font-extrabold text-slate-900 tabular-nums">{Math.round(meteo.temperatura)}°C</p>
              <p className="mt-1 text-sm text-slate-500">
                Máx. {graus(meteo.maxima)} · Mín. {graus(meteo.minima)} · Sensação {graus(meteo.sensacao)}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Dado
              Icone={Wind}
              rotulo="Vento"
              valor={`${Math.round(meteo.vento)} km/h ${direcaoCardinal(meteo.direcaoVento)}`}
              extra={`rajada ${Math.round(meteo.rajada)} km/h`}
            />
            <Dado Icone={Droplets} rotulo="Umidade" valor={`${Math.round(meteo.umidade)}%`} />
            <Dado
              Icone={Umbrella}
              rotulo="Chuva (3h)"
              valor={meteo.chuvaProximasHoras === null ? '—' : `${meteo.chuvaProximasHoras}%`}
            />
            <Dado Icone={Sun} rotulo="Índice UV" valor={meteo.uv === null ? '—' : String(Math.round(meteo.uv))} />
          </dl>

          {/* medidoEm já vem na hora de Brasília ('2026-10-28T13:00') */}
          <p className="mt-3 text-xs text-slate-500">Fonte: Open-Meteo · medição das {meteo.medidoEm.slice(11, 16)}</p>
        </>
      )}
    </Secao>
  )
}
