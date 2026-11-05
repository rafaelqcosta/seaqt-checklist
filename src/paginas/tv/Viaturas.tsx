import { Ship } from 'lucide-react'
import { emServico, valorIds } from '../../lib/checklist'
import { CHAVES } from '../../lib/constantes'
import { nomeMilitar } from '../../lib/militares'
import type { Cadastros, DadosDia, Viatura } from '../../lib/tipos'
import { limitar, Mais, Quadro, Vazio } from './Quadro'

const MAXIMO_VIATURAS = 5
// Intl.ListFormat não existe no navegador da TV (Chrome 63): 'A, B e C' montado à mão
function juntarNomes(nomes: string[]): string {
  return nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes.join('')
}

export function Viaturas({ dia, cadastros }: { dia: DadosDia; cadastros: Cadastros }) {
  const militarPorId = new Map(cadastros.militares.map((militar) => [militar.id, militar]))
  const deServico = cadastros.viaturas.filter((viatura) => emServico(dia, viatura))
  const { visiveis, restantes } = limitar(deServico, MAXIMO_VIATURAS)

  const condutores = (viatura: Viatura) =>
    valorIds(dia, CHAVES.viatura(viatura.id)).flatMap((id) => {
      const militar = militarPorId.get(id)
      return militar?.ativo ? [nomeMilitar(militar)] : []
    })

  return (
    <Quadro titulo="Viaturas" Icone={Ship}>
      {deServico.length === 0 ? (
        <Vazio>Nenhuma viatura em serviço</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((viatura) => {
            const nomes = condutores(viatura)
            return (
              <li key={viatura.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl leading-none font-black tracking-tight whitespace-nowrap">{viatura.prefixo}</span>
                  <span className="min-w-0 flex-1 truncate text-base text-slate-500">{viatura.descricao}</span>
                  <span className="shrink-0 rounded-md bg-marinho-50 px-2 py-0.5 text-sm font-bold tracking-wider text-marinho-700 ring-1 ring-marinho-700/20">
                    {viatura.base}
                  </span>
                </div>
                <div className={`mt-1 truncate text-2xl leading-tight ${nomes.length > 0 ? 'font-semibold' : 'text-slate-400'}`}>
                  {nomes.length > 0 ? juntarNomes(nomes) : 'Sem condutor'}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Mais restantes={restantes} />
    </Quadro>
  )
}
