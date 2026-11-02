import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !chavePublica) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (veja .env.example).')
}

export const supabase = createClient(url, chavePublica, {
  // chave própria: o BUCOMAT pode rodar na mesma origem (github.io) e usa outra sessão
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'seaqt_sessao' },
})

export const BUCKET = 'seaqt'

export function mensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message
  if (erro && typeof erro === 'object' && 'message' in erro) return String(erro.message)
  return String(erro)
}
