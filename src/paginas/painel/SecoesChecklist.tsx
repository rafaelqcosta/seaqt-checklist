import { Check } from 'lucide-react'
import { CampoTexto, SimNao } from '../../components/Controles'
import { valorBool, valorTexto } from '../../lib/checklist'
import { CHAVES, SISTEMAS_CBMDF } from '../../lib/constantes'
import { Autoria, Secao, textoAutoria, type PropsSecao } from './Secao'

type PropsCampo = Pick<PropsSecao, 'briefing' | 'dia'> & { chave: string; rotulo: string }

function PerguntaSimNao({ briefing, dia, chave, rotulo, rotuloSim, rotuloNao }: PropsCampo & { rotuloSim?: string; rotuloNao?: string }) {
  return (
    <div>
      <p className="rotulo">{rotulo}</p>
      <SimNao
        valor={valorBool(dia, chave)}
        onChange={(valor) => briefing.definirValor(chave, valor)}
        rotuloSim={rotuloSim}
        rotuloNao={rotuloNao}
      />
      <Autoria item={dia.checklist[chave]} />
    </div>
  )
}

function Texto({ briefing, dia, chave, rotulo, placeholder, multilinha }: PropsCampo & { placeholder?: string; multilinha?: boolean }) {
  return (
    <div className="mt-4">
      <label htmlFor={chave} className="rotulo">
        {rotulo}
      </label>
      <CampoTexto
        id={chave}
        valor={valorTexto(dia, chave)}
        onSalvar={(texto) => briefing.definirValor(chave, texto)}
        placeholder={placeholder}
        multilinha={multilinha}
      />
    </div>
  )
}

export function SecaoHiperbarica({ briefing, dia, resumo }: PropsSecao) {
  const campo = { briefing, dia }
  return (
    <Secao numero={4} titulo="Contato com a hiperbárica" resumo={resumo}>
      <PerguntaSimNao {...campo} chave={CHAVES.hiperbaricaContato} rotulo="Contato realizado?" />
      <Texto {...campo} chave={CHAVES.hiperbaricaHospital} rotulo="Hospital contatado" placeholder="Ex.: HFA" />
      <Texto {...campo} chave={CHAVES.hiperbaricaObs} rotulo="Observação" multilinha />
    </Secao>
  )
}

export function SecaoMaterial({ briefing, dia, resumo }: PropsSecao) {
  const campo = { briefing, dia }
  return (
    <Secao numero={7} titulo="Material operacional" resumo={resumo}>
      <PerguntaSimNao {...campo} chave={CHAVES.materialGrifo} rotulo="Conferido pelo GRIFO?" />
      <Texto {...campo} chave={CHAVES.materialObs} rotulo="Observações" multilinha />
    </Secao>
  )
}

export function SecaoSistemas({ briefing, dia, resumo }: PropsSecao) {
  return (
    <Secao numero={8} titulo="Sistemas CBMDF" resumo={resumo}>
      <ul className="flex flex-col gap-2">
        {SISTEMAS_CBMDF.map(({ chave, rotulo }) => {
          const feito = valorBool(dia, chave) === true
          return (
            <li key={chave}>
              <button
                type="button"
                role="checkbox"
                aria-checked={feito}
                onClick={() => briefing.definirValor(chave, !feito)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                  feito ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md border-2 ${
                    feito ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {feito && <Check className="size-5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${feito ? 'text-emerald-900' : 'text-slate-800'}`}>{rotulo}</span>
                  {feito && <span className="block truncate text-xs text-emerald-700">{textoAutoria(dia.checklist[chave])}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Secao>
  )
}

export function SecaoIncendio({ briefing, dia, resumo }: PropsSecao) {
  const campo = { briefing, dia }
  return (
    <Secao numero={9} titulo="Combate a incêndio" resumo={resumo}>
      <PerguntaSimNao {...campo} chave={CHAVES.incendioOperacional} rotulo="Situação" rotuloSim="Operacional" rotuloNao="Inoperante" />
      <Texto {...campo} chave={CHAVES.incendioObs} rotulo="Observação" multilinha />
    </Secao>
  )
}
