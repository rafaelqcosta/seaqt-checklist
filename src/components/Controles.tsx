import { useEffect, useRef, useState } from 'react'

interface SimNaoProps {
  valor: boolean | null
  onChange: (valor: boolean) => void
  rotuloSim?: string
  rotuloNao?: string
  /** Quando "Não" é um problema (padrão), ele fica vermelho; senão, neutro. */
  naoEhAlerta?: boolean
}

/** Botões Sim/Não grandes (fáceis de tocar no celular). */
export function SimNao({ valor, onChange, rotuloSim = 'Sim', rotuloNao = 'Não', naoEhAlerta = true }: SimNaoProps) {
  const base = 'botao flex-1 border'
  return (
    <div className="flex gap-2" role="radiogroup">
      <button
        type="button"
        role="radio"
        aria-checked={valor === true}
        onClick={() => onChange(true)}
        className={`${base} ${valor === true ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
      >
        {rotuloSim}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={valor === false}
        onClick={() => onChange(false)}
        className={`${base} ${
          valor === false
            ? naoEhAlerta
              ? 'border-cbm-700 bg-cbm-700 text-white'
              : 'border-slate-600 bg-slate-600 text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        {rotuloNao}
      </button>
    </div>
  )
}

interface CampoTextoProps {
  valor: string
  onSalvar: (valor: string) => void
  placeholder?: string
  multilinha?: boolean
  id?: string
}

/**
 * Campo de texto que grava ao sair do campo (ou Enter, se for de uma linha).
 * Enquanto o usuário digita, atualizações que chegam do Realtime não apagam o que está sendo escrito.
 */
export function CampoTexto({ valor, onSalvar, placeholder, multilinha, id }: CampoTextoProps) {
  const [texto, setTexto] = useState(valor)
  const focado = useRef(false)
  // compara com o valor do momento do foco: sair sem editar não apaga o que outro usuário gravou nesse meio-tempo
  const valorAoFocar = useRef(valor)

  useEffect(() => {
    if (!focado.current) setTexto(valor)
  }, [valor])

  const salvar = () => {
    focado.current = false
    const limpo = texto.trim()
    if (limpo !== valorAoFocar.current.trim()) onSalvar(limpo)
    else setTexto(valor)
  }

  const props = {
    id,
    value: texto,
    placeholder,
    className: 'campo',
    onFocus: () => {
      focado.current = true
      valorAoFocar.current = valor
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTexto(e.target.value),
    onBlur: salvar,
  }
  return multilinha ? (
    <textarea {...props} rows={2} className="campo resize-y" />
  ) : (
    <input {...props} type="text" onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
  )
}

/** Interruptor liga/desliga acessível. */
export function Interruptor({
  ligado,
  onChange,
  rotulo,
}: {
  ligado: boolean
  onChange: (ligado: boolean) => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => onChange(!ligado)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${ligado ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${ligado ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}
