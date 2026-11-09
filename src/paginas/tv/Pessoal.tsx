import { Users } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { ROTULO_STATUS } from '../../components/Estado'
import { TagGsv } from '../../components/TagGsv'
import { useUrlsAssinadas } from '../../lib/arquivos'
import type { equipeDoDia, TurnoGsv } from '../../lib/checklist'
import type { Militar, StatusCondicao } from '../../lib/tipos'
import { limitar, Quadro } from './Quadro'

type Integrante = ReturnType<typeof equipeDoDia>[number]

/** Até 8 cartões grandes numa linha; acima disso, duas linhas de cartões compactos. */
const CARTOES_POR_LINHA = 8
const MAXIMO_CARTOES = 16

const ESTILO: Record<StatusCondicao | 'aguardando', { faixa: string; borda: string }> = {
  apto: { faixa: 'bg-emerald-600 text-white', borda: 'border-emerald-300' },
  inapto: { faixa: 'bg-red-600 text-white', borda: 'border-red-500 ring-2 ring-red-500/30' },
  ausente: { faixa: 'bg-slate-500 text-white', borda: 'border-slate-200' },
  aguardando: { faixa: 'bg-amber-400 text-amber-950', borda: 'border-amber-300' },
}

export function Pessoal({ equipe }: { equipe: Integrante[] }) {
  const urls = useUrlsAssinadas(equipe.map((integrante) => integrante.militar.foto_path))
  const contar = (status: StatusCondicao | null) => equipe.filter((integrante) => integrante.condicao.status === status).length
  const plural = (quantidade: number, palavra: string) => (quantidade === 1 ? palavra : `${palavra}s`)
  const [aptos, inaptos, ausentes, aguardando] = [contar('apto'), contar('inapto'), contar('ausente'), contar(null)]

  const { visiveis, restantes } = limitar(equipe, MAXIMO_CARTOES)
  const compacto = equipe.length > CARTOES_POR_LINHA
  const colunas = Math.ceil((visiveis.length + (restantes > 0 ? 1 : 0)) / 2)

  const cartoes = visiveis.map(({ militar, condicao, gsv }) => (
    <Cartao
      key={militar.id}
      militar={militar}
      status={condicao.status}
      gsv={gsv}
      url={militar.foto_path ? urls[militar.foto_path] : undefined}
      compacto={compacto}
    />
  ))

  return (
    <Quadro
      titulo="Condição do pessoal"
      Icone={Users}
      className="shrink-0"
      extra={
        equipe.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <Contador quantidade={aptos} rotulo={plural(aptos, 'apto')} cor="bg-emerald-100 text-emerald-800" />
            <Contador quantidade={inaptos} rotulo={plural(inaptos, 'inapto')} cor="bg-red-100 text-red-800" />
            <Contador quantidade={ausentes} rotulo={plural(ausentes, 'ausente')} cor="bg-slate-200 text-slate-700" />
            {aguardando > 0 && <Contador quantidade={aguardando} rotulo="aguardando" cor="bg-amber-100 text-amber-800" />}
          </div>
        )
      }
    >
      {equipe.length === 0 ? (
        <EquipeVazia />
      ) : compacto ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
          {cartoes}
          {restantes > 0 && (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 text-3xl font-bold text-slate-500">
              +{restantes}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center gap-3">{cartoes}</div>
      )}
    </Quadro>
  )
}

function Contador({ quantidade, rotulo, cor }: { quantidade: number; rotulo: string; cor: string }) {
  return (
    <span className={`rounded-full px-3.5 py-1 text-lg font-semibold ${cor}`}>
      <b className="text-xl font-extrabold tabular-nums">{quantidade}</b> {rotulo}
    </span>
  )
}

interface CartaoProps {
  militar: Militar
  status: StatusCondicao | null
  gsv: TurnoGsv | null
  url?: string
  compacto: boolean
}

function Cartao({ militar, status, gsv, url, compacto }: CartaoProps) {
  const estilo = ESTILO[status ?? 'aguardando']
  const rotulo = status ? ROTULO_STATUS[status] : 'Aguardando'
  const esmaecido = status === 'ausente' ? 'opacity-50 grayscale' : ''

  if (compacto) {
    return (
      <article className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border bg-white p-2 ${estilo.borda} ${esmaecido}`}>
        <Avatar militar={militar} url={url} className="size-20 rounded-xl text-3xl" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-500">
            <span className="truncate">{militar.posto_graduacao}</span>
            {gsv && <TagGsv turno={gsv} className="rounded-md px-1.5 py-0.5 text-sm" classeIcone="size-3.5" />}
          </div>
          <div className="truncate text-xl font-extrabold">{militar.nome_guerra}</div>
          <div className={`mt-1 inline-block max-w-full truncate rounded-md px-2 py-0.5 text-sm font-extrabold tracking-wide uppercase ${estilo.faixa}`}>
            {rotulo}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`flex max-w-[12rem] min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-2xl border bg-white ${estilo.borda} ${esmaecido}`}
    >
      <Avatar militar={militar} url={url} className="aspect-square w-full text-6xl" />
      <div className="px-3 py-2 leading-tight">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-500">
          <span className="truncate">{militar.posto_graduacao}</span>
          {gsv && <TagGsv turno={gsv} className="rounded-md px-2 py-0.5 text-base" classeIcone="size-4" />}
        </div>
        <div className="truncate text-2xl font-extrabold">{militar.nome_guerra}</div>
      </div>
      <div className={`mt-auto py-1.5 text-center text-xl font-extrabold tracking-wide whitespace-nowrap uppercase ${estilo.faixa}`}>
        {rotulo}
      </div>
    </article>
  )
}

function EquipeVazia() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Users className="size-16 text-slate-400" />
      <p className="text-4xl font-bold">Equipe do dia ainda não informada</p>
      <p className="text-2xl text-slate-600">
        Preencha pelo celular: <span className="font-semibold text-marinho-700">{location.origin + location.pathname}</span>
      </p>
    </div>
  )
}
