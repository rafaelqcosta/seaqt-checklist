import { useSyncExternalStore } from 'react'

export interface Aviso {
  id: number
  texto: string
  tipo: 'ok' | 'erro'
}

let avisos: Aviso[] = []
let sequencia = 0
const ouvintes = new Set<() => void>()

function emitir() {
  for (const ouvinte of ouvintes) ouvinte()
}

/** Mostra uma mensagem rápida no rodapé da tela. */
export function avisar(texto: string, tipo: Aviso['tipo'] = 'ok') {
  const aviso = { id: ++sequencia, texto, tipo }
  avisos = [...avisos, aviso]
  emitir()
  setTimeout(
    () => {
      avisos = avisos.filter((a) => a.id !== aviso.id)
      emitir()
    },
    tipo === 'erro' ? 6000 : 2500,
  )
}

export function useAvisos(): Aviso[] {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte)
      return () => ouvintes.delete(ouvinte)
    },
    () => avisos,
  )
}
