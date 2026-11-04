import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Briefing } from '../../hooks/useBriefing'
import { usePonteBrado } from '../../hooks/usePonteBrado'
import { LOTACOES_BRADO } from '../../lib/constantes'
import { formatarHora } from '../../lib/datas'
import type { DadosDia } from '../../lib/tipos'

/** Situação da leitura do BRADO no dia e botão para pedir nova leitura à ponte. */
export function BarraBrado({ briefing, dia }: { briefing: Briefing; dia: DadosDia }) {
  const ponte = usePonteBrado(briefing.registrarEscalaBrado, briefing.copiarFotosBrado, dia.data)

  const lidoEm = dia.escalaBrado.reduce<string | null>((maisRecente, e) => (!maisRecente || e.lido_em > maisRecente ? e.lido_em : maisRecente), null)
  const porLotacao = Object.entries(LOTACOES_BRADO)
    .map(([codigo, sigla]) => ({ sigla, total: dia.escalaBrado.filter((e) => e.cod_lotacao === Number(codigo)).length }))
    .filter(({ total }) => total > 0)

  let orientacao: ReactNode
  if (!ponte.instalada) {
    orientacao = (
      <>
        Para ler o BRADO sozinho, instale a{' '}
        <a href="./seaqt-ponte-brado.user.js" className="font-semibold text-marinho-700 underline">
          ponte BRADO
        </a>{' '}
        (Tampermonkey) neste navegador.
      </>
    )
  } else if (!ponte.bradoAberto) {
    orientacao = 'Entre no BRADO em outra aba deste navegador para sincronizar.'
  } else if (porLotacao.length > 0) {
    orientacao = porLotacao.map(({ sigla, total }) => `${sigla}: ${total}`).join(' · ')
  } else {
    orientacao = 'BRADO aberto em outra aba.'
  }

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-slate-800">
            {lidoEm ? `Escala do BRADO lida às ${formatarHora(lidoEm)}` : 'Escala do BRADO ainda não lida para este dia'}
          </p>
          <p className="text-xs text-slate-500">{orientacao}</p>
        </div>
        <button
          type="button"
          onClick={ponte.sincronizar}
          disabled={!ponte.instalada || !ponte.bradoAberto || ponte.sincronizando}
          className="botao-secundario shrink-0 px-3"
        >
          <RefreshCw className={`size-4 ${ponte.sincronizando ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>
      {ponte.erro && <p className="mt-2 text-sm font-semibold text-cbm-700">{ponte.erro}</p>}
    </div>
  )
}
