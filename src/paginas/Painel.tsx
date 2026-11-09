import { CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { BarraTopo } from '../components/BarraTopo'
import { useDiaServicoAtual } from '../hooks/useApp'
import { useBriefing } from '../hooks/useBriefing'
import { resumoBriefing, type SecaoId } from '../lib/checklist'
import { BarraData } from './painel/BarraData'
import { SecaoGuarnicoes } from './painel/SecaoGuarnicoes'
import { SecaoOrdens } from './painel/SecaoOrdens'
import { SecaoPessoal } from './painel/SecaoPessoal'
import { SecaoViaturas } from './painel/SecaoViaturas'
import { SecaoHiperbarica, SecaoIncendio, SecaoMaterial, SecaoSistemas } from './painel/SecoesChecklist'

/** Tela de uso (celular/computador): o briefing do dia, seção por seção; tudo grava na hora. */
export function Painel() {
  const hoje = useDiaServicoAtual()
  // null = acompanha o dia de serviço atual (vira sozinho às 07:00)
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const data = escolhida ?? hoje
  const briefing = useBriefing(data)
  const { cadastros, dia, erro } = briefing
  const resumo = cadastros && dia ? resumoBriefing(dia, cadastros) : null
  const secao = (id: SecaoId) => resumo?.find((s) => s.id === id)

  return (
    <>
      <BarraTopo atual="painel">
        <BarraData
          data={data}
          hoje={hoje}
          onMudar={(nova) => setEscolhida(nova === hoje ? null : nova)}
          resumo={resumo}
          conectado={briefing.conectado}
        />
      </BarraTopo>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 pb-28">
        {erro && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <CloudOff className="size-6 shrink-0 text-cbm-700" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold text-cbm-700">Não foi possível carregar os dados</p>
              <p className="truncate text-red-900/70">{erro}</p>
            </div>
            <button type="button" onClick={briefing.recarregar} className="botao-secundario shrink-0 px-3">
              <RefreshCw className="size-4" />
              Tentar de novo
            </button>
          </div>
        )}

        {cadastros && dia ? (
          <>
            <SecaoPessoal briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('pessoal')} />
            <SecaoGuarnicoes briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('guarnicao')} />
            <SecaoHiperbarica briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('hiperbarica')} />
            <SecaoOrdens briefing={briefing} dia={dia} cadastros={cadastros} />
            <SecaoViaturas briefing={briefing} dia={dia} cadastros={cadastros} />
            <SecaoMaterial briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('material')} />
            <SecaoSistemas briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('sistemas')} />
            <SecaoIncendio briefing={briefing} dia={dia} cadastros={cadastros} resumo={secao('incendio')} />
            <p className="text-center text-xs text-slate-500">As respostas são salvas automaticamente.</p>
          </>
        ) : (
          !erro && <Esqueleto />
        )}
      </main>
    </>
  )
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2].map((indice) => (
        <div key={indice} className="cartao animate-pulse p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-4 h-20 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
