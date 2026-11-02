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

  // modo-tv: 1rem = 1/120 da largura e fundo escuro sem rolagem (index.css)
  useEffect(() => {
    document.documentElement.classList.add('modo-tv')
    return () => document.documentElement.classList.remove('modo-tv')
  }, [])

  // só militares ativos aparecem na TV; o resumo usa o mesmo recorte para os números baterem com os cartões
  const cadastrosAtivos = cadastros && { ...cadastros, militares: cadastros.militares.filter((militar) => militar.ativo) }
  const resumo = cadastrosAtivos && dia ? resumoBriefing(dia, cadastrosAtivos) : null

  return (
    <main className="flex h-screen w-screen flex-col gap-4 overflow-hidden p-4">
      <Cabecalho data={data} conectado={conectado} progressoChecklist={resumo && progresso(resumo)} />

      {cadastrosAtivos && dia && resumo ? (
        <Conteudo cadastros={cadastrosAtivos} dia={dia} resumo={resumo} tempo={tempo} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="size-16 animate-spin text-sky-300" />
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
    <header className="flex shrink-0 items-center gap-10 border-b border-white/10 pb-3">
      <div className="flex items-center gap-4">
        <img src="./favicon.svg" alt="" className="size-14 shrink-0" />
        <div className="leading-tight">
          <div className="text-3xl font-extrabold tracking-tight">
            CBMDF <span className="text-red-400">· SEAQT</span>
          </div>
          <div className="text-base font-semibold tracking-[0.2em] text-slate-400 uppercase">Briefing Operacional</div>
        </div>
      </div>

      <div className="h-12 w-px bg-white/10" />

      <div className="leading-tight">
        <div className="text-base font-semibold tracking-wider text-slate-400 uppercase">Serviço de</div>
        <div className="text-3xl font-bold">{formatarData(data)}</div>
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
        <span className="text-base font-semibold tracking-wider text-slate-400 uppercase">Checklist</span>
        <span className="text-2xl font-extrabold tabular-nums">
          {feitas}
          <span className="text-slate-500">/{total}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${feitas === total ? 'bg-emerald-400' : 'bg-sky-400'}`}
          style={{ width: `${(feitas / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

function AoVivo({ conectado }: { conectado: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-lg font-semibold ring-1 ${
        conectado ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30' : 'bg-amber-400/10 text-amber-300 ring-amber-400/30'
      }`}
    >
      <span className="relative flex size-3">
        {conectado && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative size-3 rounded-full ${conectado ? 'bg-emerald-400' : 'bg-amber-400'}`} />
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
      <div className="text-5xl leading-none font-extrabold tabular-nums">{HORA.format(agora)}</div>
      <div className="mt-1 text-base text-slate-400 first-letter:uppercase">{DATA_EXTENSO.format(agora)}</div>
    </div>
  )
}
