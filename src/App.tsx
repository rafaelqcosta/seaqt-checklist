import { LoaderCircle } from 'lucide-react'
import { Avisos } from './components/Avisos'
import { useRota, useSessao } from './hooks/useApp'
import { Cadastros } from './paginas/Cadastros'
import { Login } from './paginas/Login'
import { Painel } from './paginas/Painel'
import { TV } from './paginas/TV'

export function App() {
  const sessao = useSessao()
  const rota = useRota()

  if (sessao === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-marinho-700" />
      </div>
    )
  }

  return (
    <>
      {!sessao ? <Login /> : rota === 'tv' ? <TV /> : rota === 'cadastros' ? <Cadastros /> : <Painel />}
      <Avisos />
    </>
  )
}
