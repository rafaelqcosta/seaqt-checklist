import { useAvisos } from '../lib/avisos'

/** Mensagens rápidas (salvo, erro) no rodapé. */
export function Avisos() {
  const avisos = useAvisos()
  if (avisos.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          role="status"
          className={`max-w-md rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${aviso.tipo === 'erro' ? 'bg-cbm-700' : 'bg-slate-900'}`}
        >
          {aviso.texto}
        </div>
      ))}
    </div>
  )
}
