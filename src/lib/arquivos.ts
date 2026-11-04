import { useEffect, useState } from 'react'
import { BUCKET, supabase } from './supabase'

// Bucket privado: as fotos e PDFs são exibidos por URL assinada, guardada em cache
// para a TV não baixar a mesma imagem a cada atualização.
const VALIDADE_SEGUNDOS = 12 * 60 * 60
const RENOVAR_ANTES_MS = 60 * 60 * 1000
const cache = new Map<string, { url: string; expiraEm: number }>()

export async function urlsAssinadas(caminhos: string[]): Promise<Record<string, string>> {
  const agora = Date.now()
  const faltando = [...new Set(caminhos)].filter((c) => (cache.get(c)?.expiraEm ?? 0) - agora < RENOVAR_ANTES_MS)
  if (faltando.length > 0) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(faltando, VALIDADE_SEGUNDOS)
    if (error) throw error
    for (const item of data) {
      if (item.signedUrl && item.path) cache.set(item.path, { url: item.signedUrl, expiraEm: agora + VALIDADE_SEGUNDOS * 1000 })
    }
  }
  return Object.fromEntries(caminhos.flatMap((c) => (cache.has(c) ? [[c, cache.get(c)!.url]] : [])))
}

/** URLs assinadas para os caminhos informados (nulos são ignorados). */
export function useUrlsAssinadas(caminhos: (string | null | undefined)[]): Record<string, string> {
  const validos = caminhos.filter((c): c is string => Boolean(c))
  const chave = [...validos].sort().join('|')
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!chave) return
    let ativo = true
    urlsAssinadas(chave.split('|'))
      .then((resultado) => ativo && setUrls(resultado))
      .catch((erro) => console.error('Falha ao assinar URLs', erro))
    return () => {
      ativo = false
    }
  }, [chave])

  return urls
}

/**
 * Abre um arquivo do bucket (ex.: PDF da OM) numa nova aba.
 * Link próprio de 1 minuto (sem cache): se for compartilhado, para de funcionar logo.
 */
export async function abrirArquivo(caminho: string): Promise<void> {
  // a aba é aberta antes do await para o navegador do celular não bloquear o pop-up
  const aba = window.open('', '_blank')
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60)
    if (error) throw error
    if (aba) aba.location.href = data.signedUrl
    else window.location.href = data.signedUrl
  } catch (erro) {
    aba?.close()
    throw erro
  }
}

/** Reduz a foto para no máximo `lado` px (JPEG) antes do upload. */
export async function redimensionarImagem(arquivo: Blob, lado = 480): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo)
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(imagem.width * escala)
  canvas.height = Math.round(imagem.height * escala)
  canvas.getContext('2d')!.drawImage(imagem, 0, 0, canvas.width, canvas.height)
  imagem.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('falha ao processar a imagem'))), 'image/jpeg', 0.85),
  )
}
