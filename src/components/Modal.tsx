import { Check, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useUrlsAssinadas } from '../lib/arquivos'
import { nomeMilitar } from '../lib/militares'
import type { Militar } from '../lib/tipos'
import { Avatar } from './Avatar'

interface ModalProps {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children: ReactNode
  rodape?: ReactNode
}

/** Painel inferior no celular, janela centralizada no computador. */
export function Modal({ aberto, onFechar, titulo, children, rodape }: ModalProps) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={titulo}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onFechar} />
      <div className="relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
          <button type="button" onClick={onFechar} className="botao -mr-2 px-2 text-slate-500" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {rodape && <div className="border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{rodape}</div>}
      </div>
    </div>
  )
}

interface SeletorMilitaresProps {
  aberto: boolean
  onFechar: () => void
  titulo: string
  opcoes: Militar[]
  selecionados: string[]
  onConfirmar: (ids: string[]) => void
  /** Texto auxiliar por militar (ex.: "Inapto"). */
  detalhe?: (militar: Militar) => ReactNode
  vazio?: ReactNode
}

/** Lista de militares com marcação múltipla. */
export function SeletorMilitares({
  aberto,
  onFechar,
  titulo,
  opcoes,
  selecionados,
  onConfirmar,
  detalhe,
  vazio,
}: SeletorMilitaresProps) {
  const [marcados, setMarcados] = useState<string[]>(selecionados)
  const urls = useUrlsAssinadas(aberto ? opcoes.map((m) => m.foto_path) : [])

  useEffect(() => {
    if (aberto) setMarcados(selecionados)
    // reinicia a marcação só ao abrir
  }, [aberto])

  const alternar = (id: string) =>
    setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      rodape={
        <button
          type="button"
          className="botao-primario w-full"
          onClick={() => {
            // mantém a ordem em que foram marcados
            onConfirmar(marcados)
            onFechar()
          }}
        >
          Confirmar ({marcados.length})
        </button>
      }
    >
      {opcoes.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-500">{vazio ?? 'Nenhum militar disponível.'}</div>
      ) : (
        <ul className="-mx-1 flex flex-col gap-1">
          {opcoes.map((militar) => {
            const marcado = marcados.includes(militar.id)
            return (
              <li key={militar.id}>
                <button
                  type="button"
                  onClick={() => alternar(militar.id)}
                  aria-pressed={marcado}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${marcado ? 'bg-marinho-50' : 'hover:bg-slate-50'}`}
                >
                  <Avatar militar={militar} url={militar.foto_path ? urls[militar.foto_path] : undefined} className="size-10 rounded-full text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{nomeMilitar(militar)}</span>
                    {detalhe && <span className="block text-xs text-slate-500">{detalhe(militar)}</span>}
                  </span>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${marcado ? 'border-marinho-700 bg-marinho-700 text-white' : 'border-slate-300'}`}
                  >
                    {marcado && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
