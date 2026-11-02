import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { diaServicoAtual } from '../lib/datas'
import { buscarMeteo, type Meteo } from '../lib/meteo'
import { supabase } from '../lib/supabase'

/** Sessão do Supabase Auth (mesmo login do BUCOMAT). undefined = ainda carregando. */
export function useSessao(): Session | null | undefined {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => setSessao(novaSessao))
    return () => data.subscription.unsubscribe()
  }, [])
  return sessao
}

export type Rota = 'painel' | 'tv' | 'cadastros'

/** Rotas por hash (#/tv, #/cadastros) — funcionam em qualquer hospedagem estática. */
export function useRota(): Rota {
  const ler = (): Rota => {
    const caminho = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
    return caminho === 'tv' || caminho === 'cadastros' ? caminho : 'painel'
  }
  const [rota, setRota] = useState<Rota>(ler)
  useEffect(() => {
    const aoMudar = () => setRota(ler())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return rota
}

/** Relógio que atualiza a cada `intervaloMs`. */
export function useAgora(intervaloMs = 1000): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return agora
}

/** Dia de serviço em curso; muda sozinho na troca de serviço (07:00). */
export function useDiaServicoAtual(): string {
  const agora = useAgora(30_000)
  return diaServicoAtual(agora)
}

const INTERVALO_METEO_MS = 10 * 60 * 1000

/** Meteorologia do Lago Paranoá (Open-Meteo), atualizada a cada 10 minutos. */
export function useMeteo(): { meteo: Meteo | null; erro: boolean } {
  const [meteo, setMeteo] = useState<Meteo | null>(null)
  const [erro, setErro] = useState(false)
  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      buscarMeteo()
        .then((novo) => {
          if (!ativo) return
          setMeteo(novo)
          setErro(false)
        })
        .catch(() => ativo && setErro(true))
    atualizar()
    const id = setInterval(atualizar, INTERVALO_METEO_MS)
    return () => {
      ativo = false
      clearInterval(id)
    }
  }, [])
  return { meteo, erro }
}
