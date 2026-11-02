import { POSTOS } from './constantes'
import type { Militar } from './tipos'

export function nomeMilitar(militar: Pick<Militar, 'posto_graduacao' | 'nome_guerra'>): string {
  return `${militar.posto_graduacao} ${militar.nome_guerra}`
}

export function iniciais(militar: Pick<Militar, 'nome_guerra'>): string {
  return militar.nome_guerra
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

function indicePosto(posto: string): number {
  const indice = (POSTOS as readonly string[]).indexOf(posto)
  return indice === -1 ? POSTOS.length : indice
}

/** Ordem hierárquica (posto/graduação) e depois nome de guerra. */
export function ordenarMilitares<T extends Pick<Militar, 'posto_graduacao' | 'nome_guerra'>>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      indicePosto(a.posto_graduacao) - indicePosto(b.posto_graduacao) ||
      a.nome_guerra.localeCompare(b.nome_guerra, 'pt-BR'),
  )
}
