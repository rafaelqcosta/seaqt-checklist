import { FUSO, HORA_TROCA_SERVICO } from './constantes'

const partesBrasilia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

/** Dia de serviço em curso (YYYY-MM-DD). Vira às HORA_TROCA_SERVICO de Brasília. */
export function diaServicoAtual(agora = new Date()): string {
  const partes = Object.fromEntries(partesBrasilia.formatToParts(agora).map((p) => [p.type, p.value]))
  const hoje = `${partes.year}-${partes.month}-${partes.day}`
  return Number(partes.hour) < HORA_TROCA_SERVICO ? somarDias(hoje, -1) : hoje
}

export function somarDias(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

/** '2026-10-28' -> 'qua., 28/10/2026' (ou com as opções informadas). */
export function formatarData(
  dataIso: string,
  opcoes: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', ...opcoes }).format(new Date(Date.UTC(ano, mes - 1, dia)))
}

/** '13:00:00' -> '13h00' */
export function formatarHorario(horario: string | null): string {
  if (!horario) return ''
  const [hora, minuto] = horario.split(':')
  return `${hora}h${minuto}`
}

const horaBrasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' })

/** Instante -> 'HH:MM' em Brasília. */
export function formatarHora(instante: string | Date): string {
  return horaBrasilia.format(typeof instante === 'string' ? new Date(instante) : instante)
}
