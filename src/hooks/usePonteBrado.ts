import { useCallback, useEffect, useState } from 'react'
import type { MilitarBrado } from '../lib/tipos'
import type { Briefing } from './useBriefing'

/**
 * Conversa com o userscript "SEAQT · Ponte BRADO" (Tampermonkey) por window.postMessage.
 * O userscript lê a escala na aba do BRADO e a entrega aqui; quem grava é o SEAQT,
 * com o login do próprio usuário. Mensagens:
 *   app -> ponte: { origem: 'seaqt-app', tipo: 'ola' | 'sincronizar', data? }
 *   ponte -> app: { origem: 'seaqt-ponte', tipo: 'estado', bradoAberto }
 *                 { origem: 'seaqt-ponte', tipo: 'escala', id, data, lidoEm, lotacoes: [{ codLotacao, militares }] }
 *                 { origem: 'seaqt-ponte', tipo: 'erro', mensagem }
 */

interface EscalaRecebida {
  id: string
  data: string
  lidoEm: string
  lotacoes: { codLotacao: number; militares: MilitarBrado[] }[]
}

const CHAVE_ULTIMA_ESCALA = 'seaqt.ponte.ultimaEscala'

function ehEscala(msg: Record<string, unknown>): msg is Record<string, unknown> & EscalaRecebida {
  return (
    typeof msg.id === 'string' &&
    typeof msg.data === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(msg.data) &&
    typeof msg.lidoEm === 'string' &&
    Array.isArray(msg.lotacoes) &&
    msg.lotacoes.every((l) => typeof l?.codLotacao === 'number' && Array.isArray(l?.militares))
  )
}

// a ponte reenvia a última leitura sempre que o SEAQT abre: não gravar a mesma duas vezes
function jaGravada(id: string): boolean {
  try {
    return localStorage.getItem(CHAVE_ULTIMA_ESCALA) === id
  } catch {
    return false
  }
}

function marcarGravada(id: string) {
  try {
    localStorage.setItem(CHAVE_ULTIMA_ESCALA, id)
  } catch {
    // sem armazenamento: no máximo grava de novo na próxima abertura
  }
}

export function usePonteBrado(
  registrar: Briefing['registrarEscalaBrado'],
  copiarFotos: Briefing['copiarFotosBrado'],
  dataServico: string,
) {
  const [instalada, setInstalada] = useState(false)
  const [bradoAberto, setBradoAberto] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const aoReceber = async (evento: MessageEvent) => {
      // só a origem: a ponte roda no "mundo" isolado do Tampermonkey, onde event.source pode não bater
      if (evento.origin !== window.location.origin) return
      const msg = evento.data as Record<string, unknown> | null
      if (!msg || msg.origem !== 'seaqt-ponte') return
      setInstalada(true)

      if (msg.tipo === 'estado') {
        setBradoAberto(Boolean(msg.bradoAberto))
      } else if (msg.tipo === 'erro') {
        setSincronizando(false)
        setErro(String(msg.mensagem ?? 'Falha ao ler o BRADO.'))
      } else if (msg.tipo === 'escala' && ehEscala(msg)) {
        if (!jaGravada(msg.id)) {
          for (const lotacao of msg.lotacoes) {
            if (!(await registrar(msg.data, lotacao.codLotacao, lotacao.militares, msg.lidoEm))) return
          }
          await copiarFotos(msg.lotacoes.flatMap((lotacao) => lotacao.militares))
          marcarGravada(msg.id)
        }
        setSincronizando(false)
        setErro(null)
      }
    }
    window.addEventListener('message', aoReceber)
    window.postMessage({ origem: 'seaqt-app', tipo: 'ola' }, window.location.origin)
    return () => window.removeEventListener('message', aoReceber)
  }, [registrar, copiarFotos])

  const sincronizar = useCallback(() => {
    setSincronizando(true)
    setErro(null)
    window.postMessage({ origem: 'seaqt-app', tipo: 'sincronizar', data: dataServico }, window.location.origin)
  }, [dataServico])

  return { instalada, bradoAberto, sincronizando, erro, sincronizar }
}
