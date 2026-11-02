import { ClipboardCheck } from 'lucide-react'
import { IconeEstado } from '../../components/Estado'
import { valorBool, valorTexto, type EstadoSecao, type ResumoSecao, type SecaoId } from '../../lib/checklist'
import { CHAVES, SISTEMAS_CBMDF } from '../../lib/constantes'
import type { DadosDia } from '../../lib/tipos'
import { Quadro } from './Quadro'

// cores do IconeEstado são para fundo claro; na TV escura precisam ser mais vivas
const COR_ICONE: Record<EstadoSecao, string> = {
  ok: 'text-emerald-400!',
  alerta: 'text-red-500!',
  pendente: 'text-amber-400!',
}

const COR_DETALHE: Record<EstadoSecao, string> = {
  ok: 'text-slate-300',
  alerta: 'font-semibold text-red-300',
  pendente: 'text-amber-200',
}

const OBSERVACAO: Partial<Record<SecaoId, string>> = {
  hiperbarica: CHAVES.hiperbaricaObs,
  material: CHAVES.materialObs,
  incendio: CHAVES.incendioObs,
}

// rótulos curtos para a lista de pendentes caber no painel
function complemento(dia: DadosDia, secao: SecaoId): string {
  if (secao === 'sistemas') {
    const pendentes = SISTEMAS_CBMDF.filter((sistema) => valorBool(dia, sistema.chave) !== true)
    return pendentes.length > 0 ? `Falta: ${pendentes.map((sistema) => sistema.curto).join(' · ')}` : ''
  }
  const chave = OBSERVACAO[secao]
  return chave ? valorTexto(dia, chave) : ''
}

export function Checklist({ dia, resumo }: { dia: DadosDia; resumo: ResumoSecao[] }) {
  return (
    <Quadro titulo="Checklist" Icone={ClipboardCheck} className="flex-1">
      <ul className="flex flex-col gap-3">
        {resumo.map((secao) => {
          const texto = complemento(dia, secao.id)
          return (
            <li key={secao.id} className="flex gap-3">
              <IconeEstado estado={secao.estado} className={`size-8 shrink-0 ${COR_ICONE[secao.estado]}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xl leading-tight font-bold">{secao.titulo}</div>
                <div className={`truncate text-base leading-snug ${COR_DETALHE[secao.estado]}`}>{secao.detalhe}</div>
                {texto && (
                  <div className={`text-sm leading-snug text-slate-400 ${secao.id === 'sistemas' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                    {texto}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Quadro>
  )
}
