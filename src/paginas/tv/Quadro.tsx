import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

/** Rolagem automática da TV: parada no topo, desce devagar, parada no fim, volta ao topo. */
const PAUSA_MS = 5000
const VELOCIDADE_PX_POR_S = 30

interface QuadroProps {
  titulo: string
  Icone: LucideIcon
  /** Conteúdo à direita do título (contadores, local...). */
  extra?: ReactNode
  className?: string
  children: ReactNode
}

/** Painel da TV. Se o conteúdo não couber, rola sozinho em loop (na TV não dá para rolar com o controle). */
export function Quadro({ titulo, Icone, extra, className = '', children }: QuadroProps) {
  const conteudo = useRef<HTMLDivElement>(null)
  useRolagemAutomatica(conteudo)
  return (
    <section className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2.5 text-[1.1rem] font-bold tracking-[0.12em] text-slate-500 uppercase">
          <Icone className="size-6 shrink-0 text-marinho-700" />
          <span className="truncate">{titulo}</span>
        </h2>
        {extra}
      </header>
      <div ref={conteudo} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </section>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="m-auto text-center text-xl text-slate-400">{children}</p>
}

/**
 * Só rola quando o conteúdo passa do painel. Usa requestAnimationFrame e confere a altura a cada quadro
 * (ResizeObserver não existe no navegador da TV, Chrome 63).
 */
function useRolagemAutomatica(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const caixa = ref.current
    if (!caixa) return
    let quadro = 0
    let anterior = performance.now()
    let pausaAte = anterior + PAUSA_MS
    // scrollTop arredonda para pixel inteiro; a posição real fica aqui para a descida lenta não travar
    let posicao = 0
    const passo = (agora: number) => {
      const limite = caixa.scrollHeight - caixa.clientHeight
      if (limite <= 1) {
        if (posicao !== 0) caixa.scrollTop = posicao = 0
        pausaAte = agora + PAUSA_MS
      } else if (agora >= pausaAte) {
        if (posicao >= limite) {
          posicao = 0
          pausaAte = agora + PAUSA_MS
        } else {
          posicao = Math.min(limite, posicao + ((agora - anterior) * VELOCIDADE_PX_POR_S) / 1000)
          if (posicao >= limite) pausaAte = agora + PAUSA_MS
        }
        caixa.scrollTop = posicao
      }
      anterior = agora
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [ref])
}

/** Até `maximo` itens; se passar, mostra um a menos para o "e mais k" ocupar o lugar do último. */
export function limitar<T>(lista: T[], maximo: number): { visiveis: T[]; restantes: number } {
  if (lista.length <= maximo) return { visiveis: lista, restantes: 0 }
  return { visiveis: lista.slice(0, maximo - 1), restantes: lista.length - (maximo - 1) }
}
