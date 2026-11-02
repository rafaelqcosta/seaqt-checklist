import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Marca } from '../components/BarraTopo'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setEntrando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEntrando(false)
    if (error) setErro(/invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fundo px-4 py-10">
      <form onSubmit={entrar} className="cartao w-full max-w-sm p-6">
        <Marca subtitulo="Briefing · Grupamento de Mergulho" />
        <h1 className="mt-6 text-xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-500">Use o mesmo login do BUCOMAT.</p>

        <label className="mt-5 block">
          <span className="rotulo">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="campo"
          />
        </label>
        <label className="mt-3 block">
          <span className="rotulo">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="campo"
          />
        </label>

        {erro && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-cbm-700">
            {erro}
          </p>
        )}

        <button type="submit" disabled={entrando} className="botao-primario mt-5 w-full">
          {entrando && <LoaderCircle className="size-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </main>
  )
}
