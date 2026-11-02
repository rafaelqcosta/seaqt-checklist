import { iniciais } from '../lib/militares'
import type { Militar } from '../lib/tipos'

interface Props {
  militar: Pick<Militar, 'nome_guerra'>
  /** URL assinada da foto (useUrlsAssinadas); sem ela mostra as iniciais. */
  url?: string
  className?: string
}

/** Foto do militar ou iniciais. O tamanho e o arredondamento vêm de `className`. */
export function Avatar({ militar, url, className = 'size-11 rounded-full text-sm' }: Props) {
  if (url) {
    return <img src={url} alt={militar.nome_guerra} className={`shrink-0 object-cover ${className}`} />
  }
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-marinho-100 font-bold text-marinho-700 ${className}`}
    >
      {iniciais(militar)}
    </div>
  )
}
