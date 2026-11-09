import { ICONES_VIATURA } from '../lib/constantes'
import type { IconeViatura as Icone } from '../lib/tipos'

/** Desenho da viatura; a altura vem do className e a largura acompanha a proporção. */
export function IconeViatura({ icone, className = '' }: { icone: Icone | null; className?: string }) {
  if (!icone) return null
  const rotulo = ICONES_VIATURA.find((opcao) => opcao.id === icone)?.rotulo ?? ''
  return <img src={`./viaturas/${icone}.webp`} alt={rotulo} title={rotulo} className={`w-auto shrink-0 object-contain ${className}`} />
}
