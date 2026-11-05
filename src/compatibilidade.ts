// Recursos que o navegador da TV (Samsung Tizen 5, Chrome 63) não tem e que o build legado não cobre.
// Importado antes de tudo em main.tsx.
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only' // AbortController: Chrome 66+, usado pelo supabase-js

// crypto.randomUUID: Chrome 92+
if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // versão 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`
  }
}
