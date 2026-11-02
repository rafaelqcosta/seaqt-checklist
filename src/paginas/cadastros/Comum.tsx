import { LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Interruptor } from '../../components/Controles'
import { avisar } from '../../lib/avisos'

/** '1 viatura' / '3 viaturas' */
export function contar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

/** Ordem sugerida para um novo item: depois do último. */
export function proximaOrdem(itens: { ordem: number }[]): number {
  return Math.max(0, ...itens.map((item) => item.ordem)) + 10
}

/** Executa salvar/excluir com spinner; se der certo, avisa e fecha o formulário. */
export function useEnvio(onFechar: () => void) {
  const [salvando, setSalvando] = useState(false)
  const enviar = async (acao: () => Promise<boolean>, mensagem = 'Salvo') => {
    setSalvando(true)
    const ok = await acao()
    setSalvando(false)
    if (!ok) return
    avisar(mensagem)
    onFechar()
  }
  return { salvando, enviar }
}

export function CabecalhoAba({
  titulo,
  resumo,
  rotuloNovo,
  onNovo,
}: {
  titulo: string
  resumo: string
  rotuloNovo: string
  onNovo: () => void
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        <p className="truncate text-sm text-slate-500">{resumo}</p>
      </div>
      <button type="button" onClick={onNovo} className="botao-primario shrink-0">
        <Plus className="size-5" />
        {rotuloNovo}
      </button>
    </div>
  )
}

export function ListaCadastro({ children }: { children: ReactNode }) {
  return <ul className="cartao divide-y divide-slate-100 overflow-hidden">{children}</ul>
}

/** Linha da lista; tocar abre a edição. */
export function ItemCadastro({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
      >
        {children}
        <Pencil aria-hidden className="size-4 shrink-0 text-slate-400" />
      </button>
    </li>
  )
}

export function Selo({ children, positivo = false }: { children: ReactNode; positivo?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${positivo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}
    >
      {children}
    </span>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

export function Campo({
  rotulo,
  dica,
  className = '',
  children,
}: {
  rotulo: string
  dica?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="rotulo">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-slate-500">{dica}</span>}
    </label>
  )
}

/** Interruptor com rótulo e explicação; a linha inteira é tocável. */
export function LinhaInterruptor({
  rotulo,
  descricao,
  ligado,
  onChange,
}: {
  rotulo: string
  descricao: string
  ligado: boolean
  onChange: (ligado: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{rotulo}</span>
        <span className="block text-xs text-slate-500">{descricao}</span>
      </span>
      <Interruptor ligado={ligado} onChange={onChange} rotulo={rotulo} />
    </label>
  )
}

/** Botões do rodapé do modal; "Salvar" envia o formulário `formulario` (fica fora dele). */
export function RodapeFormulario({
  formulario,
  salvando,
  onExcluir,
}: {
  formulario: string
  salvando: boolean
  onExcluir?: () => void
}) {
  return (
    <div className="flex gap-2">
      {onExcluir && (
        <button type="button" onClick={onExcluir} disabled={salvando} className="botao-perigo">
          <Trash2 className="size-5" />
          Excluir
        </button>
      )}
      <button type="submit" form={formulario} disabled={salvando} className="botao-primario flex-1">
        {salvando && <LoaderCircle className="size-5 animate-spin" />}
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}
