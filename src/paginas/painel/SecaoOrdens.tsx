import { FileText, LoaderCircle, MapPin, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { Briefing } from '../../hooks/useBriefing'
import { abrirArquivo } from '../../lib/arquivos'
import { avisar } from '../../lib/avisos'
import { formatarHorario } from '../../lib/datas'
import type { OrdemMissao } from '../../lib/tipos'
import { Secao, Vazio, type PropsSecao } from './Secao'

const LIMITE_PDF_MB = 20

function problemaNoPdf(arquivo: File): string | null {
  if (arquivo.type !== 'application/pdf' && !/\.pdf$/i.test(arquivo.name)) return 'Escolha um arquivo PDF.'
  if (arquivo.size > LIMITE_PDF_MB * 1024 * 1024) return `O PDF deve ter no máximo ${LIMITE_PDF_MB} MB.`
  return null
}

export function SecaoOrdens({ briefing, dia }: PropsSecao) {
  const [criando, setCriando] = useState(false)
  const { ordens } = dia

  const excluir = (ordem: OrdemMissao) => {
    if (window.confirm(`Excluir a OM "${ordem.titulo}"?`)) briefing.excluirOrdem(ordem)
  }
  const abrirPdf = (caminho: string) => abrirArquivo(caminho).catch(() => avisar('Não foi possível abrir o PDF', 'erro'))

  return (
    <Secao
      numero={5}
      titulo="Ordens de missão"
      detalhe={ordens.length === 0 ? 'Nenhuma OM' : `${ordens.length} OM${ordens.length > 1 ? 's' : ''}`}
    >
      {ordens.length === 0 ? (
        <Vazio>Nenhuma ordem de missão neste dia.</Vazio>
      ) : (
        <ul className="divide-y divide-slate-100">
          {ordens.map((ordem) => (
            <li key={ordem.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-16 shrink-0 rounded-lg bg-marinho-50 py-2 text-center font-extrabold text-marinho-700 tabular-nums">
                {formatarHorario(ordem.horario) || '—'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-snug font-bold break-words text-slate-900">{ordem.titulo}</p>
                {ordem.local && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{ordem.local}</span>
                  </p>
                )}
              </div>
              {ordem.arquivo_path && (
                <button
                  type="button"
                  onClick={() => abrirPdf(ordem.arquivo_path!)}
                  title={ordem.arquivo_nome ?? 'PDF'}
                  className="botao-secundario shrink-0 px-3"
                >
                  <FileText className="size-4" />
                  PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => excluir(ordem)}
                title="Excluir OM"
                aria-label={`Excluir OM ${ordem.titulo}`}
                className="botao w-11 shrink-0 px-0 text-slate-400 hover:bg-red-50 hover:text-cbm-700"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => setCriando(true)} className="botao-secundario mt-4 w-full">
        <Plus className="size-5" />
        Nova ordem de missão
      </button>
      {criando && <NovaOrdem criarOrdem={briefing.criarOrdem} onFechar={() => setCriando(false)} />}
    </Secao>
  )
}

/** Formulário da nova OM; montado só enquanto o modal está aberto (o estado zera ao fechar). */
function NovaOrdem({ criarOrdem, onFechar }: { criarOrdem: Briefing['criarOrdem']; onFechar: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [horario, setHorario] = useState('')
  const [local, setLocal] = useState('')
  const [pdf, setPdf] = useState<File | null>(null)
  const [erroPdf, setErroPdf] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const escolherPdf = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0] ?? null
    const problema = arquivo && problemaNoPdf(arquivo)
    setErroPdf(problema)
    setPdf(problema ? null : arquivo)
    if (problema) evento.target.value = ''
  }

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!titulo.trim() || enviando) return
    setEnviando(true)
    const ok = await criarOrdem({ titulo: titulo.trim(), horario: horario || null, local: local.trim() || null }, pdf)
    setEnviando(false)
    if (ok) {
      avisar('OM adicionada')
      onFechar()
    }
  }

  return (
    <Modal
      aberto
      onFechar={() => !enviando && onFechar()}
      titulo="Nova ordem de missão"
      rodape={
        <button type="submit" form="nova-om" disabled={enviando || !titulo.trim()} className="botao-primario w-full">
          {enviando && <LoaderCircle className="size-4 animate-spin" />}
          {enviando ? 'Enviando…' : 'Adicionar OM'}
        </button>
      }
    >
      <form id="nova-om" onSubmit={salvar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="om-titulo" className="rotulo">
            Título *
          </label>
          <input
            id="om-titulo"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Prevenção ABMIL"
            className="campo"
          />
        </div>
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <div>
            <label htmlFor="om-horario" className="rotulo">
              Horário
            </label>
            <input id="om-horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="campo" />
          </div>
          <div className="min-w-0">
            <label htmlFor="om-local" className="rotulo">
              Local
            </label>
            <input
              id="om-local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Opcional"
              className="campo"
            />
          </div>
        </div>
        <div>
          <span className="rotulo">PDF da OM</span>
          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 hover:bg-slate-50">
            <Paperclip className="size-5 shrink-0 text-marinho-700" />
            <span className={`min-w-0 flex-1 truncate text-sm font-medium ${pdf ? 'text-slate-900' : 'text-slate-500'}`}>
              {pdf ? pdf.name : `Anexar PDF (opcional, máx. ${LIMITE_PDF_MB} MB)`}
            </span>
            <input type="file" accept="application/pdf" onChange={escolherPdf} className="sr-only" />
          </label>
          {erroPdf && <p className="mt-1 text-sm font-medium text-cbm-700">{erroPdf}</p>}
        </div>
      </form>
    </Modal>
  )
}
