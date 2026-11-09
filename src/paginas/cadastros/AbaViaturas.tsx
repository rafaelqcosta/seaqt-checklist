import { useState, type FormEvent } from 'react'
import { IconeViatura } from '../../components/IconeViatura'
import { Modal } from '../../components/Modal'
import type { Briefing } from '../../hooks/useBriefing'
import { BASES, ICONES_VIATURA } from '../../lib/constantes'
import type { Base, IconeViatura as Icone, Viatura } from '../../lib/tipos'
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
  viaturas: Viatura[]
  salvar: Briefing['salvarViatura']
  excluir: Briefing['excluirViatura']
}

export function AbaViaturas({ viaturas, salvar, excluir }: Props) {
  const [editando, setEditando] = useState<Viatura | 'nova' | null>(null)
  const ativas = viaturas.filter((v) => v.ativa).length

  return (
    <>
      <CabecalhoAba
        titulo="Viaturas"
        resumo={`${contar(viaturas.length, 'viatura', 'viaturas')} · ${contar(ativas, 'ativa', 'ativas')}`}
        rotuloNovo="Nova viatura"
        onNovo={() => setEditando('nova')}
      />

      {viaturas.length === 0 ? (
        <Vazio>Nenhuma viatura cadastrada ainda.</Vazio>
      ) : (
        <ListaCadastro>
          {viaturas.map((viatura) => (
            <ItemCadastro key={viatura.id} onClick={() => setEditando(viatura)}>
              <span
                className={`flex h-11 min-w-16 shrink-0 items-center justify-center rounded-lg px-2 text-base font-extrabold tracking-tight ${viatura.ativa ? 'bg-marinho-700 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {viatura.prefixo}
              </span>
              <IconeViatura icone={viatura.icone} className={`h-9 max-w-20 ${viatura.ativa ? '' : 'opacity-50 grayscale'}`} />
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-semibold ${viatura.ativa ? 'text-slate-900' : 'text-slate-500'}`}>
                  {viatura.descricao || 'Sem descrição'}
                </span>
                <span className="block truncate text-sm text-slate-500">
                  Base {viatura.base} · ordem {viatura.ordem}
                </span>
              </span>
              <Selo positivo={viatura.ativa}>{viatura.ativa ? 'Ativa' : 'Inativa'}</Selo>
            </ItemCadastro>
          ))}
        </ListaCadastro>
      )}

      {editando && (
        <FormViatura
          key={editando === 'nova' ? 'nova' : editando.id}
          viatura={editando === 'nova' ? null : editando}
          viaturas={viaturas}
          salvar={salvar}
          excluir={excluir}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  )
}

function FormViatura({
  viatura,
  viaturas,
  salvar,
  excluir,
  onFechar,
}: Props & {
  /** null = novo cadastro */
  viatura: Viatura | null
  onFechar: () => void
}) {
  const [prefixo, setPrefixo] = useState(viatura?.prefixo ?? '')
  const [descricao, setDescricao] = useState(viatura?.descricao ?? '')
  const [base, setBase] = useState<Base>(viatura?.base ?? 'BUC')
  const [ordem, setOrdem] = useState(String(viatura?.ordem ?? proximaOrdem(viaturas)))
  const [ativa, setAtiva] = useState(viatura?.ativa ?? true)
  const [icone, setIcone] = useState<Icone | null>(viatura?.icone ?? null)
  const [erro, setErro] = useState<string | null>(null)
  const { salvando, enviar } = useEnvio(onFechar)

  const aoSalvar = (evento: FormEvent) => {
    evento.preventDefault()
    const prefixoFinal = prefixo.trim().toLocaleUpperCase('pt-BR')
    // o banco também recusa (prefixo é único), mas assim a mensagem fica clara
    if (viaturas.some((v) => v.id !== viatura?.id && v.prefixo.toLocaleUpperCase('pt-BR') === prefixoFinal)) {
      setErro('Já existe uma viatura com esse prefixo.')
      return
    }
    enviar(() =>
      salvar({
        id: viatura?.id,
        prefixo: prefixoFinal,
        descricao: descricao.trim() || null,
        base,
        ordem: Math.round(Number(ordem)) || 0,
        ativa,
        icone,
      }),
    )
  }

  const aoExcluir = () => {
    if (!viatura || !window.confirm(`Excluir a viatura ${viatura.prefixo}?`)) return
    enviar(() => excluir(viatura.id), 'Viatura excluída')
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={viatura ? `Editar viatura ${viatura.prefixo}` : 'Nova viatura'}
      rodape={<RodapeFormulario formulario="form-viatura" salvando={salvando} onExcluir={viatura ? aoExcluir : undefined} />}
    >
      <form id="form-viatura" onSubmit={aoSalvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_8rem] items-start gap-3">
          <Campo rotulo="Prefixo">
            <input
              required
              pattern=".*\S.*"
              title="Informe o prefixo"
              value={prefixo}
              onChange={(e) => {
                setPrefixo(e.target.value)
                setErro(null)
              }}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="Ex.: L15"
              aria-invalid={Boolean(erro)}
              className="campo uppercase placeholder:normal-case"
            />
          </Campo>
          <Campo rotulo="Ordem" dica="Menor vem primeiro">
            <input
              type="number"
              inputMode="numeric"
              step={1}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="campo tabular-nums"
            />
          </Campo>
        </div>
        {erro && (
          <p role="alert" className="-mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-cbm-700">
            {erro}
          </p>
        )}

        <Campo rotulo="Descrição">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: Lancha"
            className="campo"
          />
        </Campo>

        <fieldset>
          <legend className="rotulo">Base</legend>
          <div className="grid grid-cols-2 gap-2">
            {BASES.map((opcao) => (
              <button
                key={opcao}
                type="button"
                aria-pressed={base === opcao}
                onClick={() => setBase(opcao)}
                className={`botao border ${base === opcao ? 'border-marinho-700 bg-marinho-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="rotulo">Ícone (opcional)</legend>
          <div className="grid grid-cols-3 gap-2">
            {[null, ...ICONES_VIATURA.map((opcao) => opcao.id)].map((opcao) => (
              <button
                key={opcao ?? 'nenhum'}
                type="button"
                aria-pressed={icone === opcao}
                aria-label={opcao ? undefined : 'Sem ícone'}
                onClick={() => setIcone(opcao)}
                className={`flex h-14 items-center justify-center rounded-lg border p-1.5 ${icone === opcao ? 'border-marinho-700 bg-marinho-50 ring-2 ring-marinho-700' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                {opcao ? <IconeViatura icone={opcao} className="max-h-full max-w-full" /> : <span className="text-xs font-semibold text-slate-500">Nenhum</span>}
              </button>
            ))}
          </div>
        </fieldset>

        <LinhaInterruptor
          rotulo="Ativa"
          descricao="Pronta para ser empregada. Inativa não pode entrar em serviço no dia."
          ligado={ativa}
          onChange={setAtiva}
        />
      </form>
    </Modal>
  )
}
