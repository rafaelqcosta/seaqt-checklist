import { useCallback, useEffect, useState } from 'react'

// Chrome < 71 (navegador da TV) só tem a API de tela cheia com prefixo webkit
type DocumentoAntigo = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void }
type ElementoAntigo = HTMLElement & { webkitRequestFullscreen?: () => void }

const documento = document as DocumentoAntigo
const raiz = document.documentElement as ElementoAntigo

function emTelaCheia(): boolean {
  return Boolean(documento.fullscreenElement ?? documento.webkitFullscreenElement)
}

/** Tela cheia do navegador (esconde abas e barra de endereço). `suportada` = false se o navegador não deixa. */
export function useTelaCheia() {
  const [ativa, setAtiva] = useState(emTelaCheia)
  const suportada = Boolean(raiz.requestFullscreen ?? raiz.webkitRequestFullscreen)

  useEffect(() => {
    const atualizar = () => setAtiva(emTelaCheia())
    document.addEventListener('fullscreenchange', atualizar)
    document.addEventListener('webkitfullscreenchange', atualizar)
    return () => {
      document.removeEventListener('fullscreenchange', atualizar)
      document.removeEventListener('webkitfullscreenchange', atualizar)
    }
  }, [])

  const alternar = useCallback(() => {
    if (emTelaCheia()) {
      // Promise.resolve: alguns navegadores antigos não devolvem promessa
      if (documento.exitFullscreen) Promise.resolve(documento.exitFullscreen()).catch(() => {})
      else documento.webkitExitFullscreen?.()
    } else if (raiz.requestFullscreen) {
      Promise.resolve(raiz.requestFullscreen()).catch(() => {})
    } else {
      raiz.webkitRequestFullscreen?.()
    }
  }, [])

  return { ativa, suportada, alternar }
}
