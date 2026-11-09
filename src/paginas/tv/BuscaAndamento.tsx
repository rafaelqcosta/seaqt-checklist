import { Search } from 'lucide-react'
import { Quadro, Vazio } from './Quadro'

/** Reservado para as buscas em andamento; funcionalidade ainda não implementada. */
export function BuscaAndamento() {
  return (
    <Quadro titulo="Busca em andamento" Icone={Search} className="h-full">
      <Vazio>Em desenvolvimento</Vazio>
    </Quadro>
  )
}
