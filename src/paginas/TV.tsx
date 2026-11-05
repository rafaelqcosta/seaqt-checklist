import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useAgora, useDiaServicoAtual, useMeteo } from '../hooks/useApp'
import { useBriefing } from '../hooks/useBriefing'
import { equipeDoDia, guarnicaoDoDia, progresso, resumoBriefing, type ResumoSecao } from '../lib/checklist'
import { FUSO } from '../lib/constantes'
import { formatarData, formatarHora } from '../lib/datas'
import type { Meteo } from '../lib/meteo'
import type { Cadastros, DadosDia } from '../lib/tipos'
import { Checklist } from './tv/Checklist'
import { Guarnicoes } from './tv/Guarnicoes'
import { Meteorologia } from './tv/Meteorologia'
import { Ordens } from './tv/Ordens'
import { Pessoal } from './tv/Pessoal'
import { Viaturas } from './tv/Viaturas'

/** Painel-resumo para a TV da sala de operações (só leitura, sem rolagem). */
export function TV() {
  const data = useDiaServicoAtual()
  const { cadastros, dia, conectado, erro, sincronizadoEm } = useBriefing(data)
  // fora do Conteudo para não buscar de novo quando o dia de serviço vira e os dados recarregam
  const tempo = useMeteo()

  // modo-tv: 1rem = 1/120 da largura e fundo claro sem rolagem (index.css)
  useEffect(() => {
    document.documentElement.classList.add('modo-tv')
    return () => document.documentElement.classList.remove('modo-tv')
  }, [])

  // só militares ativos aparecem na TV; o resumo usa o mesmo recorte para os números baterem com os cartões
  const cadastrosAtivos = cadastros && { ...cadastros, militares: cadastros.militares.filter((militar) => militar.ativo) }
  const resumo = cadastrosAtivos && dia ? resumoBriefing(dia, cadastrosAtivos) : null

  return (
    <main className="flex h-screen w-screen flex-col gap-3 overflow-hidden px-4 pt-2.5 pb-4">
      <Cabecalho data={data} conectado={conectado} progressoChecklist={resumo && progresso(resumo)} />

      {cadastrosAtivos && dia && resumo ? (
        <Conteudo cadastros={cadastrosAtivos} dia={dia} resumo={resumo} tempo={tempo} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="size-16 animate-spin text-marinho-600" />
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="fixed bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-700/95 px-5 py-1.5 text-base font-semibold whitespace-nowrap text-white shadow-lg"
        >
          <TriangleAlert className="size-5" />
          Falha ao atualizar · {sincronizadoEm ? `exibindo dados de ${formatarHora(sincronizadoEm)}` : 'tentando novamente…'}
        </div>
      )}
    </main>
  )
}

interface ConteudoProps {
  cadastros: Cadastros
  dia: DadosDia
  resumo: ResumoSecao[]
  tempo: { meteo: Meteo | null; erro: boolean }
}

function Conteudo({ cadastros, dia, resumo, tempo }: ConteudoProps) {
  const equipe = equipeDoDia(dia, cadastros)
  const guarnicao = guarnicaoDoDia(dia, cadastros)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_26rem] grid-rows-1 gap-4">
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        <Pessoal equipe={equipe} />
        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-1 gap-4">
          <Guarnicoes dia={dia} guarnicao={guarnicao} />
          <Viaturas dia={dia} cadastros={cadastros} />
          <Ordens ordens={dia.ordens} />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-4">
        <Meteorologia meteo={tempo.meteo} erro={tempo.erro} />
        <Checklist dia={dia} resumo={resumo} />
      </div>
    </div>
  )
}

interface CabecalhoProps {
  data: string
  conectado: boolean
  progressoChecklist: { feitas: number; total: number } | null
}

function Cabecalho({ data, conectado, progressoChecklist }: CabecalhoProps) {
  return (
    <header className="flex shrink-0 items-center gap-8 border-b border-slate-200 pb-2">
      <div className="flex items-center gap-3">
        <img src="./brasao.svg" alt="" className="size-11 shrink-0" />
        <div className="leading-tight">
          <div className="text-2xl font-extrabold tracking-tight">
            CBMDF <span className="text-cbm-700">· SEAQT</span>
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Briefing Operacional</div>
        </div>
      </div>

      <div className="h-9 w-px bg-slate-300" />

      <div className="leading-tight">
        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Serviço de</div>
        <div className="text-2xl font-bold">{formatarData(data)}</div>
      </div>

      {progressoChecklist && <Progresso {...progressoChecklist} />}

      <div className="ml-auto flex items-center gap-8">
        <AoVivo conectado={conectado} />
        <Relogio />
      </div>
    </header>
  )
}

function Progresso({ feitas, total }: { feitas: number; total: number }) {
  return (
    <div className="w-[15rem]">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Checklist</span>
        <span className="text-xl font-extrabold tabular-nums">
          {feitas}
          <span className="text-slate-400">/{total}</span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${feitas === total ? 'bg-emerald-500' : 'bg-marinho-600'}`}
          style={{ width: `${(feitas / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

function AoVivo({ conectado }: { conectado: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-full px-3.5 py-1 text-base font-semibold ring-1 ${
        conectado ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/30' : 'bg-amber-50 text-amber-700 ring-amber-500/40'
      }`}
    >
      <span className="relative flex size-3">
        {conectado && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />}
        <span className={`relative size-3 rounded-full ${conectado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </span>
      {conectado ? 'Ao vivo' : 'Reconectando…'}
    </div>
  )
}

const HORA = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
const DATA_EXTENSO = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'long', day: 'numeric', month: 'long' })

/** Componente próprio para só o relógio redesenhar a cada segundo. */
function Relogio() {
  const agora = useAgora(1000)
  return (
    <div className="text-right">
      <div className="text-4xl leading-none font-extrabold tabular-nums">{HORA.format(agora)}</div>
      <div className="mt-0.5 text-sm text-slate-500 first-letter:uppercase">{DATA_EXTENSO.format(agora)}</div>
    </div>
  )
}
