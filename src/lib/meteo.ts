import { FUSO, LOCAL_METEO } from './constantes'

export interface Meteo {
  temperatura: number
  sensacao: number
  umidade: number
  /** km/h */
  vento: number
  rajada: number
  direcaoVento: number
  codigo: number
  ehDia: boolean
  uv: number | null
  /** Maior probabilidade de chuva (%) nas próximas 3 horas. */
  chuvaProximasHoras: number | null
  maxima: number | null
  minima: number | null
  /** Horário da medição (ISO local de Brasília, sem fuso). */
  medidoEm: string
  /** Previsão hora a hora a partir da hora atual. */
  proximasHoras: PrevisaoHora[]
}

export interface PrevisaoHora {
  /** ISO local de Brasília, hora cheia ('2026-10-28T13:00'). */
  hora: string
  temperatura: number
  /** Probabilidade de chuva (%). */
  chuva: number | null
  codigo: number
  ehDia: boolean
}

/** Quantas horas a previsão hora a hora cobre. */
const HORAS_PREVISAO = 12

/** Severidade para a operação na água. */
export type Severidade = 'normal' | 'atencao' | 'perigo'

export async function buscarMeteo(): Promise<Meteo> {
  const parametros = new URLSearchParams({
    latitude: String(LOCAL_METEO.latitude),
    longitude: String(LOCAL_METEO.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day',
    hourly: 'precipitation_probability,temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: FUSO,
    forecast_days: '2',
    wind_speed_unit: 'kmh',
  })
  const resposta = await fetch(`https://api.open-meteo.com/v1/forecast?${parametros}`)
  if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`)
  const json = await resposta.json()

  const atual = json.current
  const horas: string[] = json.hourly?.time ?? []
  const probabilidades: (number | null)[] = json.hourly?.precipitation_probability ?? []
  // horários do Open-Meteo vêm em hora local cheia ('2026-10-28T13:00'); pega a hora atual e as 2 seguintes
  const horaAtual = String(atual.time).slice(0, 13)
  const inicio = horas.findIndex((h) => h.slice(0, 13) === horaAtual)
  const proximas = inicio === -1 ? [] : probabilidades.slice(inicio, inicio + 3).filter((p): p is number => p !== null)

  return {
    temperatura: atual.temperature_2m,
    sensacao: atual.apparent_temperature,
    umidade: atual.relative_humidity_2m,
    vento: atual.wind_speed_10m,
    rajada: atual.wind_gusts_10m,
    direcaoVento: atual.wind_direction_10m,
    codigo: atual.weather_code,
    ehDia: atual.is_day === 1,
    uv: atual.uv_index ?? null,
    chuvaProximasHoras: proximas.length ? Math.max(...proximas) : null,
    maxima: json.daily?.temperature_2m_max?.[0] ?? null,
    minima: json.daily?.temperature_2m_min?.[0] ?? null,
    medidoEm: atual.time,
    proximasHoras:
      inicio === -1
        ? []
        : horas.slice(inicio, inicio + HORAS_PREVISAO).map((hora, indice) => ({
            hora,
            temperatura: json.hourly.temperature_2m[inicio + indice],
            chuva: probabilidades[inicio + indice] ?? null,
            codigo: json.hourly.weather_code[inicio + indice],
            ehDia: json.hourly.is_day[inicio + indice] === 1,
          })),
  }
}

/** Descrição em português do código WMO. */
export function descricaoTempo(codigo: number): string {
  if (codigo === 0) return 'Céu limpo'
  if (codigo === 1) return 'Predomínio de sol'
  if (codigo === 2) return 'Parcialmente nublado'
  if (codigo === 3) return 'Nublado'
  if (codigo === 45 || codigo === 48) return 'Nevoeiro'
  if (codigo >= 51 && codigo <= 57) return 'Garoa'
  if (codigo === 61 || codigo === 80) return 'Chuva fraca'
  if (codigo === 63 || codigo === 81) return 'Chuva moderada'
  if (codigo === 65 || codigo === 82) return 'Chuva forte'
  if (codigo === 66 || codigo === 67) return 'Chuva congelante'
  if (codigo >= 71 && codigo <= 77) return 'Neve'
  if (codigo === 85 || codigo === 86) return 'Neve'
  if (codigo === 95) return 'Trovoada'
  if (codigo === 96 || codigo === 99) return 'Trovoada com granizo'
  return 'Condição desconhecida'
}

export type TipoIconeTempo = 'sol' | 'lua' | 'sol-nuvem' | 'lua-nuvem' | 'nuvem' | 'nevoeiro' | 'garoa' | 'chuva' | 'trovoada' | 'neve'

export function iconeTempo(codigo: number, ehDia: boolean): TipoIconeTempo {
  if (codigo === 0) return ehDia ? 'sol' : 'lua'
  if (codigo === 1 || codigo === 2) return ehDia ? 'sol-nuvem' : 'lua-nuvem'
  if (codigo === 3) return 'nuvem'
  if (codigo === 45 || codigo === 48) return 'nevoeiro'
  if (codigo >= 51 && codigo <= 57) return 'garoa'
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'neve'
  if (codigo >= 95) return 'trovoada'
  return 'chuva'
}

/** Trovoada = perigo; chuva forte ou rajada >= 40 km/h = atenção. */
export function severidade(meteo: Meteo): Severidade {
  if (meteo.codigo >= 95) return 'perigo'
  if ([65, 82].includes(meteo.codigo) || meteo.rajada >= 40) return 'atencao'
  return 'normal'
}
