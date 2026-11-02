import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Interruptor } from '../../components/Controles'
import { SeletorMilitares } from '../../components/Modal'
import { equipeDoDia, valorIds } from '../../lib/checklist'
import { BASES, CHAVES } from '../../lib/constantes'
import type { Viatura } from '../../lib/tipos'
import { ChipsMilitares, detalheCondicao, LinkCadastros, Secao, Vazio, type PropsSecao } from './Secao'

export function SecaoViaturas({ briefing, dia, cadastros }: PropsSecao) {
  const [editando, setEditando] = useState<Viatura | null>(null)
  const { viaturas } = cadastros
  const equipe = equipeDoDia(dia, cadastros)
  const militarPorId = new Map(cadastros.militares.map((m) => [m.id, m]))
  const condutores = (viatura: Viatura) =>
    valorIds(dia, CHAVES.viatura(viatura.id)).flatMap((id) => militarPorId.get(id) ?? [])
  const disponiveis = viaturas.filter((v) => v.ativa).length

  return (
    <Secao
      numero={6}
      titulo="Viaturas"
      detalhe={viaturas.length === 0 ? 'Nenhuma viatura cadastrada' : `${disponiveis}/${viaturas.length} disponíveis`}
    >
      {viaturas.length === 0 ? (
        <Vazio>Nenhuma viatura cadastrada.</Vazio>
      ) : (
        <ul className="divide-y divide-slate-100">
          {viaturas.map((viatura) => {
            const escalados = condutores(viatura)
            return (
              <li key={viatura.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`min-w-0 flex-1 ${viatura.ativa ? '' : 'opacity-50'}`}>
                    <p className="text-lg leading-tight font-extrabold text-slate-900">{viatura.prefixo}</p>
                    <p className="truncate text-sm text-slate-500">{viatura.ativa ? viatura.descricao : 'Indisponível'}</p>
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                    Disponível
                    <Interruptor
                      ligado={viatura.ativa}
                      onChange={(ativa) => briefing.salvarViatura({ id: viatura.id, ativa })}
                      rotulo={`${viatura.prefixo} disponível`}
                    />
                  </label>
                </div>

                <div className={`mt-2 flex items-center gap-3 ${viatura.ativa ? '' : 'opacity-50'}`}>
                  <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Base</span>
                  <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label={`Base da ${viatura.prefixo}`}>
                    {BASES.map((base) => (
                      <button
                        key={base}
                        type="button"
                        role="radio"
                        aria-checked={viatura.base === base}
                        onClick={() => viatura.base !== base && briefing.salvarViatura({ id: viatura.id, base })}
                        className={`min-h-11 min-w-16 rounded-md px-4 text-sm font-bold transition ${
                          viatura.base === base ? 'bg-marinho-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        {base}
                      </button>
                    ))}
                  </div>
                </div>

                {viatura.ativa && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Condutores do dia</span>
                      <button type="button" onClick={() => setEditando(viatura)} className="botao-secundario px-3">
                        {escalados.length > 0 ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                        {escalados.length > 0 ? 'Editar' : 'Escalar'}
                      </button>
                    </div>
                    <div className="mt-2">
                      <ChipsMilitares militares={escalados} dia={dia} />
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-2">
        <LinkCadastros>Gerenciar viaturas</LinkCadastros>
      </div>
      <SeletorMilitares
        aberto={editando !== null}
        onFechar={() => setEditando(null)}
        titulo={editando ? `Condutores · ${editando.prefixo}` : ''}
        opcoes={equipe.map((e) => e.militar)}
        selecionados={editando ? valorIds(dia, CHAVES.viatura(editando.id)) : []}
        onConfirmar={(ids) => {
          if (editando) briefing.definirValor(CHAVES.viatura(editando.id), ids)
        }}
        detalhe={detalheCondicao(dia)}
        vazio="Defina a equipe do dia primeiro (seção 1)."
      />
    </Secao>
  )
}
