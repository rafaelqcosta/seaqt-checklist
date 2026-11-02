import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { Briefing } from '../../hooks/useBriefing'
import type { Funcao } from '../../lib/tipos'
import {
  CabecalhoAba,
  Campo,
  contar,
  ItemCadastro,
  LinhaInterruptor,
  ListaCadastro,
  proximaOrdem,
  RodapeFormulario,
  Selo,
  useEnvio,
  Vazio,
} from './Comum'

interface Props {
  funcoes: Funcao[]
  salvar: Briefing['salvarFuncao']
  excluir: Briefing['excluirFuncao']
}

export function AbaFuncoes({ funcoes, salvar, excluir }: Props) {
  const [editando, setEditando] = useState<Funcao | 'nova' | null>(null)
  const ativas = funcoes.filter((f) => f.ativa).length
  const inativas = funcoes.length - ativas

  return (
    <>
      <CabecalhoAba
        titulo="Funções"
        resumo={[contar(ativas, 'ativa', 'ativas'), inativas > 0 && contar(inativas, 'inativa', 'inativas')].filter(Boolean).join(' · ')}
        rotuloNovo="Nova função"
        onNovo={() => setEditando('nova')}
      />

      {funcoes.length === 0 ? (
        <Vazio>Nenhuma função cadastrada ainda.</Vazio>
      ) : (
        <ListaCadastro>
          {funcoes.map((funcao) => (
            <ItemCadastro key={funcao.id} onClick={() => setEditando(funcao)}>
              <span
                title="Ordem"
                className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-bold tabular-nums ${funcao.ativa ? 'bg-marinho-50 text-marinho-700' : 'bg-slate-100 text-slate-400'}`}
              >
                {funcao.ordem}
              </span>
              <span className={`line-clamp-2 min-w-0 flex-1 font-semibold ${funcao.ativa ? 'text-slate-900' : 'text-slate-500'}`}>
                {funcao.nome}
              </span>
              {!funcao.ativa && <Selo>Inativa</Selo>}
            </ItemCadastro>
          ))}
        </ListaCadastro>
      )}

      {editando && (
        <FormFuncao
          key={editando === 'nova' ? 'nova' : editando.id}
          funcao={editando === 'nova' ? null : editando}
          funcoes={funcoes}
          salvar={salvar}
          excluir={excluir}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  )
}

function FormFuncao({
  funcao,
  funcoes,
  salvar,
  excluir,
  onFechar,
}: Props & {
  /** null = novo cadastro */
  funcao: Funcao | null
  onFechar: () => void
}) {
  const [nome, setNome] = useState(funcao?.nome ?? '')
  const [ordem, setOrdem] = useState(String(funcao?.ordem ?? proximaOrdem(funcoes)))
  const [ativa, setAtiva] = useState(funcao?.ativa ?? true)
  const { salvando, enviar } = useEnvio(onFechar)

  const aoSalvar = (evento: FormEvent) => {
    evento.preventDefault()
    enviar(() =>
      salvar({ id: funcao?.id, nome: nome.trim().replace(/\s+/g, ' '), ordem: Math.round(Number(ordem)) || 0, ativa }),
    )
  }

  const aoExcluir = () => {
    const mensagem = `Excluir a função “${funcao?.nome}”?\n\nAs escalas antigas dela deixam de aparecer. Para só ocultá-la, desative.`
    if (!funcao || !window.confirm(mensagem)) return
    enviar(() => excluir(funcao.id), 'Função excluída')
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={funcao ? 'Editar função' : 'Nova função'}
      rodape={<RodapeFormulario formulario="form-funcao" salvando={salvando} onExcluir={funcao ? aoExcluir : undefined} />}
    >
      <form id="form-funcao" onSubmit={aoSalvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome">
          <input
            required
            pattern=".*\S.*"
            title="Informe o nome da função"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: 1ª Dupla de Mergulho"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Ordem" dica="Menor vem primeiro no checklist e na TV.">
          <input
            type="number"
            inputMode="numeric"
            step={1}
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="campo w-32 tabular-nums"
          />
        </Campo>
        <LinhaInterruptor
          rotulo="Ativa"
          descricao="Função inativa some do checklist e da TV, mas as escalas antigas ficam guardadas."
          ligado={ativa}
          onChange={setAtiva}
        />
      </form>
    </Modal>
  )
}
