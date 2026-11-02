import { CircleAlert, ListOrdered, LoaderCircle, RefreshCw, Truck, Users } from 'lucide-react'
import { useState } from 'react'
import { BarraTopo } from '../components/BarraTopo'
import { useDiaServicoAtual } from '../hooks/useApp'
import { useBriefing } from '../hooks/useBriefing'
import { AbaFuncoes } from './cadastros/AbaFuncoes'
import { AbaMilitares } from './cadastros/AbaMilitares'
import { AbaViaturas } from './cadastros/AbaViaturas'

const ABAS = [
  { id: 'militares', rotulo: 'Militares', Icone: Users },
  { id: 'viaturas', rotulo: 'Viaturas', Icone: Truck },
  { id: 'funcoes', rotulo: 'Funções', Icone: ListOrdered },
] as const

type Aba = (typeof ABAS)[number]['id']

export function Cadastros() {
  const briefing = useBriefing(useDiaServicoAtual())
  const { cadastros } = briefing
  const [aba, setAba] = useState<Aba>('militares')

  return (
    <div className="min-h-dvh">
      <BarraTopo atual="cadastros">
        <div className="mx-auto max-w-3xl px-4 pb-2.5">
          <div role="tablist" aria-label="Tipo de cadastro" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {ABAS.map(({ id, rotulo, Icone }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={aba === id}
                onClick={() => setAba(id)}
                className={`botao gap-1.5 px-2 ${aba === id ? 'bg-white text-marinho-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Icone className="size-4 shrink-0" />
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      </BarraTopo>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-24">
        {cadastros ? (
          aba === 'militares' ? (
            <AbaMilitares militares={cadastros.militares} salvar={briefing.salvarMilitar} />
          ) : aba === 'viaturas' ? (
            <AbaViaturas viaturas={cadastros.viaturas} salvar={briefing.salvarViatura} excluir={briefing.excluirViatura} />
          ) : (
            <AbaFuncoes funcoes={cadastros.funcoes} salvar={briefing.salvarFuncao} excluir={briefing.excluirFuncao} />
          )
        ) : briefing.erro ? (
          <div role="alert" className="cartao flex flex-col items-center gap-2 px-4 py-10 text-center">
            <CircleAlert className="size-8 text-cbm-700" />
            <p className="font-semibold text-slate-900">Não foi possível carregar os cadastros</p>
            <p className="text-sm text-slate-500">{briefing.erro}</p>
            <button type="button" onClick={() => briefing.recarregar()} className="botao-secundario mt-2">
              <RefreshCw className="size-4" />
              Tentar de novo
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-20">
            <LoaderCircle aria-label="Carregando" className="size-8 animate-spin text-marinho-700" />
          </div>
        )}
      </main>
    </div>
  )
}
