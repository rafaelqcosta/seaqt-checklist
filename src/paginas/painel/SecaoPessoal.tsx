import { UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { CampoTexto } from '../../components/Controles'
import { ROTULO_STATUS } from '../../components/Estado'
import { SeletorMilitares } from '../../components/Modal'
import { useUrlsAssinadas } from '../../lib/arquivos'
import { equipeDoDia } from '../../lib/checklist'
import { LOTACOES_BRADO } from '../../lib/constantes'
import { nomeMilitar } from '../../lib/militares'
import type { Militar, StatusCondicao } from '../../lib/tipos'
import { BarraBrado } from './BarraBrado'
import { LinkCadastros, Secao, Vazio, type PropsSecao } from './Secao'

const BOTOES_STATUS: { status: StatusCondicao; ativo: string }[] = [
  { status: 'apto', ativo: 'border-emerald-600 bg-emerald-600 text-white' },
  { status: 'inapto', ativo: 'border-cbm-700 bg-cbm-700 text-white' },
  { status: 'ausente', ativo: 'border-slate-600 bg-slate-600 text-white' },
]

export function SecaoPessoal({ briefing, dia, cadastros, resumo }: PropsSecao) {
  const [adicionando, setAdicionando] = useState(false)
  const equipe = equipeDoDia(dia, cadastros)
  const urls = useUrlsAssinadas(equipe.map((e) => e.militar.foto_path))
  const ativos = cadastros.militares.filter((m) => m.ativo)
  const foraDaEquipe = ativos.filter((m) => !equipe.some((e) => e.militar.id === m.id))

  const remover = (militar: Militar) => {
    if (window.confirm(`Remover ${nomeMilitar(militar)} da equipe do dia? Ele também sai das funções e viaturas.`)) {
      briefing.removerDaEquipe(militar.id)
    }
  }

  return (
    <Secao numero={1} titulo="Condição do pessoal" resumo={resumo}>
      <BarraBrado briefing={briefing} dia={dia} />
      {equipe.length === 0 ? (
        <Vazio>
          {ativos.length === 0 ? (
            <>
              Nenhum militar ativo cadastrado.
              <br />
              <LinkCadastros>Cadastrar militares</LinkCadastros>
            </>
          ) : (
            'Equipe do dia ainda não definida. Adicione quem está de serviço.'
          )}
        </Vazio>
      ) : (
        <ul className="divide-y divide-slate-100">
          {equipe.map(({ militar, condicao, brado, gsv }) => (
            <li key={militar.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Avatar
                  militar={militar}
                  url={militar.foto_path ? urls[militar.foto_path] : undefined}
                  className="size-12 rounded-full text-base"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="truncate">{nomeMilitar(militar)}</span>
                    {gsv && (
                      <span className="shrink-0 rounded bg-orange-500 px-1.5 py-0.5 text-xs leading-none font-extrabold text-white">GSV</span>
                    )}
                  </p>
                  {brado && (
                    <p className="truncate text-xs text-slate-500">
                      BRADO · {LOTACOES_BRADO[brado.cod_lotacao] ?? brado.cod_lotacao}
                      {brado.turno && ` · ${brado.turno}`}
                    </p>
                  )}
                  {brado?.aviso && <p className="text-xs font-semibold text-cbm-700">{brado.aviso}</p>}
                  {condicao.status === null && <p className="text-xs font-semibold text-amber-700">Condição não informada</p>}
                </div>
                {/* quem está na escala do BRADO não sai daqui: marque ausente/inapto */}
                {!brado && (
                  <button
                    type="button"
                    onClick={() => remover(militar)}
                    title="Remover da equipe"
                    aria-label={`Remover ${nomeMilitar(militar)} da equipe`}
                    className="botao w-11 px-0 text-slate-400 hover:bg-red-50 hover:text-cbm-700"
                  >
                    <UserMinus className="size-5" />
                  </button>
                )}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Condição de ${nomeMilitar(militar)}`}>
                {BOTOES_STATUS.map(({ status, ativo }) => (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={condicao.status === status}
                    onClick={() =>
                      // tocar de novo no marcado volta a "aguardando"; ao voltar a apto ou aguardando,
                      // o motivo (pode ser dado de saúde) deixa de ser guardado
                      condicao.status === status
                        ? briefing.definirCondicao(militar.id, { status: null, observacao: null })
                        : briefing.definirCondicao(militar.id, status === 'apto' ? { status, observacao: null } : { status })
                    }
                    title={condicao.status === status ? 'Toque de novo para voltar a aguardando' : undefined}
                    className={`botao border px-2 ${condicao.status === status ? ativo : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {ROTULO_STATUS[status]}
                  </button>
                ))}
              </div>
              {condicao.status !== null && (
                <p className="mt-1 text-center text-xs text-slate-400">Toque de novo no marcado para voltar a aguardando</p>
              )}

              {(condicao.status === 'inapto' || condicao.status === 'ausente') && (
                <div className="mt-2">
                  <label htmlFor={`motivo-${militar.id}`} className="rotulo">
                    Motivo (não aparece na TV)
                  </label>
                  <CampoTexto
                    id={`motivo-${militar.id}`}
                    valor={condicao.observacao ?? ''}
                    onSalvar={(texto) => briefing.definirCondicao(militar.id, { observacao: texto || null })}
                    placeholder="Opcional"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {ativos.length > 0 && (
        <button type="button" onClick={() => setAdicionando(true)} className="botao-secundario mt-4 w-full">
          <UserPlus className="size-5" />
          Adicionar à equipe
        </button>
      )}
      <SeletorMilitares
        aberto={adicionando}
        onFechar={() => setAdicionando(false)}
        titulo="Adicionar à equipe do dia"
        opcoes={foraDaEquipe}
        selecionados={[]}
        onConfirmar={(ids) => {
          if (ids.length > 0) briefing.adicionarNaEquipe(ids)
        }}
        vazio="Todos os militares ativos já estão na equipe."
      />
    </Secao>
  )
}
