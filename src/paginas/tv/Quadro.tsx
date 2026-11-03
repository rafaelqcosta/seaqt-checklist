import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface QuadroProps {
  titulo: string
  Icone: LucideIcon
  /** Conteúdo à direita do título (contadores, local...). */
  extra?: ReactNode
  className?: string
  children: ReactNode
}

/** Painel da TV. O conteúdo é cortado no limite do painel, nunca rola. */
export function Quadro({ titulo, Icone, extra, className = '', children }: QuadroProps) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2.5 text-[1.1rem] font-bold tracking-[0.12em] text-slate-500 uppercase">
          <Icone className="size-6 shrink-0 text-marinho-700" />
          <span className="truncate">{titulo}</span>
        </h2>
        {extra}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="m-auto text-center text-xl text-slate-400">{children}</p>
}

/** Linha "e mais k" para os itens que não couberam. */
export function Mais({ restantes }: { restantes: number }) {
  if (restantes === 0) return null
  return <p className="shrink-0 pt-2 text-lg font-semibold text-slate-500">e mais {restantes}</p>
}

/** Até `maximo` itens; se passar, mostra um a menos para o "e mais k" ocupar o lugar do último. */
export function limitar<T>(lista: T[], maximo: number): { visiveis: T[]; restantes: number } {
  if (lista.length <= maximo) return { visiveis: lista, restantes: 0 }
  return { visiveis: lista.slice(0, maximo - 1), restantes: lista.length - (maximo - 1) }
}
