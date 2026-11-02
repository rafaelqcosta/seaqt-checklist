import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { SeletorMilitares } from '../../components/Modal'
import { equipeDoDia, guarnicaoDoDia, valorIds } from '../../lib/checklist'
import { CHAVES } from '../../lib/constantes'
import type { Funcao } from '../../lib/tipos'
import { ChipsMilitares, detalheCondicao, LinkCadastros, Secao, Vazio, type PropsSecao } from './Secao'

export function SecaoGuarnicoes({ briefing, dia, cadastros, resumo }: PropsSecao) {
  const [editando, setEditando] = useState<Funcao | null>(null)
  const equipe = equipeDoDia(dia, cadastros)
  const guarnicao = guarnicaoDoDia(dia, cadastros)

  return (
    <Secao numero={2} titulo="Divisão das guarnições" resumo={resumo}>
      {guarnicao.length === 0 ? (
        <Vazio>Nenhuma função ativa cadastrada.</Vazio>
      ) : equipe.length === 0 ? (
        <Vazio>Defina a equipe do dia primeiro (seção 1).</Vazio>
      ) : (
        <ul className="divide-y divide-slate-100">
          {guarnicao.map(({ funcao, militares }) => (
            <li key={funcao.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-sm font-bold text-slate-700">{funcao.nome}</p>
                <ChipsMilitares militares={militares} dia={dia} />
              </div>
              <button type="button" onClick={() => setEditando(funcao)} className="botao-secundario shrink-0 px-3">
                {militares.length > 0 ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                {militares.length > 0 ? 'Editar' : 'Escalar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2">
        <LinkCadastros>Gerenciar funções</LinkCadastros>
      </div>
      <SeletorMilitares
        aberto={editando !== null}
        onFechar={() => setEditando(null)}
        titulo={editando?.nome ?? ''}
        opcoes={equipe.map((e) => e.militar)}
        selecionados={editando ? valorIds(dia, CHAVES.guarnicao(editando.id)) : []}
        onConfirmar={(ids) => {
          if (editando) briefing.definirValor(CHAVES.guarnicao(editando.id), ids)
        }}
        detalhe={detalheCondicao(dia)}
      />
    </Secao>
  )
}
