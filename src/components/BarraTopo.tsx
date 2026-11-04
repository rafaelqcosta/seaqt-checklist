import { ClipboardCheck, LogOut, Settings, Tv } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Rota } from '../hooks/useApp'
import { supabase } from '../lib/supabase'

const LINKS: { rota: Rota; href: string; rotulo: string; Icone: typeof Tv }[] = [
  { rota: 'painel', href: '#/', rotulo: 'Checklist', Icone: ClipboardCheck },
  { rota: 'tv', href: '#/tv', rotulo: 'Modo TV', Icone: Tv },
  { rota: 'cadastros', href: '#/cadastros', rotulo: 'Cadastros', Icone: Settings },
]

/** Marca SEAQT (ícone + nome). */
export function Marca({ subtitulo = 'Checklist Operacional' }: { subtitulo?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img src="./brasao.svg" alt="" className="size-10 shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-marinho-700">
          CBMDF <span className="text-cbm-700">· SEAQT</span>
        </div>
        <div className="truncate text-xs font-medium text-slate-500">{subtitulo}</div>
      </div>
    </div>
  )
}

/** Barra superior das telas de uso (celular/computador). `children` aparece abaixo, ainda fixo no topo. */
export function BarraTopo({ atual, children }: { atual: Rota; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <Marca />
        <nav className="flex items-center gap-1">
          {LINKS.map(({ rota, href, rotulo, Icone }) => (
            <a
              key={rota}
              href={href}
              title={rotulo}
              aria-current={rota === atual ? 'page' : undefined}
              className={`botao px-2.5 sm:px-3 ${rota === atual ? 'bg-marinho-50 text-marinho-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icone className="size-5" />
              <span className="hidden md:inline">{rotulo}</span>
            </a>
          ))}
          <button
            type="button"
            title="Sair"
            onClick={() => supabase.auth.signOut()}
            className="botao px-2.5 text-slate-500 hover:bg-slate-100"
          >
            <LogOut className="size-5" />
          </button>
        </nav>
      </div>
      {children}
    </header>
  )
}
