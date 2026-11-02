import { Camera, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Avatar } from '../../components/Avatar'
import { Modal } from '../../components/Modal'
import type { Briefing } from '../../hooks/useBriefing'
import { useUrlsAssinadas } from '../../lib/arquivos'
import { POSTOS } from '../../lib/constantes'
import { nomeMilitar } from '../../lib/militares'
import type { Militar } from '../../lib/tipos'
import {
  CabecalhoAba,
  Campo,
  contar,
  ItemCadastro,
  LinhaInterruptor,
  ListaCadastro,
  RodapeFormulario,
  Selo,
  useEnvio,
  Vazio,
} from './Comum'

/** Minúsculo e sem acento, para "conceicao" achar "CONCEIÇÃO". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

interface Props {
  militares: Militar[]
  salvar: Briefing['salvarMilitar']
}

export function AbaMilitares({ militares, salvar }: Props) {
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Militar | 'novo' | null>(null)
  const urls = useUrlsAssinadas(militares.map((m) => m.foto_path))

  const termo = normalizar(busca.trim())
  const encontrados = militares.filter((m) => normalizar(`${nomeMilitar(m)} ${m.matricula ?? ''}`).includes(termo))
  // ativos primeiro; dentro de cada grupo mantém a ordem hierárquica
  const lista = [...encontrados.filter((m) => m.ativo), ...encontrados.filter((m) => !m.ativo)]
  const ativos = militares.filter((m) => m.ativo).length
  const inativos = militares.length - ativos

  return (
    <>
      <CabecalhoAba
        titulo="Militares"
        resumo={[contar(ativos, 'ativo', 'ativos'), inativos > 0 && contar(inativos, 'inativo', 'inativos')].filter(Boolean).join(' · ')}
        rotuloNovo="Novo militar"
        onNovo={() => setEditando('novo')}
      />

      {militares.length === 0 ? (
        <Vazio>Nenhum militar cadastrado ainda.</Vazio>
      ) : (
        <>
          <div className="relative mb-3">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou matrícula"
              aria-label="Buscar militar"
              className="campo pl-10"
            />
          </div>
          {lista.length === 0 ? (
            <Vazio>Nenhum militar encontrado para “{busca.trim()}”.</Vazio>
          ) : (
            <ListaCadastro>
              {lista.map((militar) => (
                <ItemCadastro key={militar.id} onClick={() => setEditando(militar)}>
                  <Avatar
                    militar={militar}
                    url={militar.foto_path ? urls[militar.foto_path] : undefined}
                    className={`size-11 rounded-full text-sm ${militar.ativo ? '' : 'opacity-50 grayscale'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-semibold ${militar.ativo ? 'text-slate-900' : 'text-slate-500'}`}>
                      {nomeMilitar(militar)}
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {militar.matricula ? `Mat. ${militar.matricula}` : 'Sem matrícula'}
                    </span>
                  </span>
                  {!militar.ativo && <Selo>Inativo</Selo>}
                </ItemCadastro>
              ))}
            </ListaCadastro>
          )}
        </>
      )}

      {editando && (
        <FormMilitar
          key={editando === 'novo' ? 'novo' : editando.id}
          militar={editando === 'novo' ? null : editando}
          urlFoto={editando !== 'novo' && editando.foto_path ? urls[editando.foto_path] : undefined}
          salvar={salvar}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  )
}

function FormMilitar({
  militar,
  urlFoto,
  salvar,
  onFechar,
}: {
  /** null = novo cadastro */
  militar: Militar | null
  urlFoto?: string
  salvar: Props['salvar']
  onFechar: () => void
}) {
  const [posto, setPosto] = useState(militar?.posto_graduacao ?? '')
  const [nome, setNome] = useState(militar?.nome_guerra ?? '')
  const [matricula, setMatricula] = useState(militar?.matricula ?? '')
  const [ativo, setAtivo] = useState(militar?.ativo ?? true)
  const [foto, setFoto] = useState<File | null>(null)
  const { salvando, enviar } = useEnvio(onFechar)

  const previa = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto])
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa)
    },
    [previa],
  )
  const urlExibida = previa ?? urlFoto

  const aoSalvar = (evento: FormEvent) => {
    evento.preventDefault()
    enviar(() =>
      salvar(
        {
          id: militar?.id,
          posto_graduacao: posto,
          nome_guerra: nome.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'),
          matricula: matricula.trim() || null,
          ativo,
        },
        foto,
      ),
    )
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={militar ? 'Editar militar' : 'Novo militar'}
      rodape={<RodapeFormulario formulario="form-militar" salvando={salvando} />}
    >
      <form id="form-militar" onSubmit={aoSalvar} className="flex flex-col gap-4">
        {/* sem `capture`: no celular o sistema oferece câmera ou galeria */}
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 p-3 transition focus-within:border-marinho-700 focus-within:ring-4 focus-within:ring-marinho-700/15 hover:bg-slate-50">
          <span className="relative shrink-0">
            {urlExibida || nome.trim() ? (
              <Avatar militar={{ nome_guerra: nome }} url={urlExibida} className="size-20 rounded-full text-2xl" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-marinho-50 text-marinho-700">
                <UserRound className="size-9" />
              </span>
            )}
            <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-marinho-700 text-white">
              <Camera className="size-4" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-slate-900">
              {foto ? 'Nova foto selecionada' : urlFoto ? 'Trocar foto' : 'Adicionar foto'}
            </span>
            <span className="block text-sm text-slate-500">
              {foto ? 'Será enviada ao salvar. Toque para escolher outra.' : 'Toque para tirar ou escolher da galeria.'}
            </span>
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="grid grid-cols-[8.5rem_1fr] gap-3">
          <Campo rotulo="Posto/Grad.">
            <select required value={posto} onChange={(e) => setPosto(e.target.value)} className="campo">
              <option value="" disabled>
                Selecione
              </option>
              {POSTOS.map((opcao) => (
                <option key={opcao}>{opcao}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Nome de guerra">
            <input
              required
              pattern=".*\S.*"
              title="Informe o nome de guerra"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="Ex.: BRENO"
              className="campo uppercase placeholder:normal-case"
            />
          </Campo>
        </div>

        <Campo rotulo="Matrícula (opcional)">
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            autoComplete="off"
            placeholder="Ex.: 140.231-1"
            className="campo"
          />
        </Campo>

        {militar && (
          <LinhaInterruptor
            rotulo="Ativo"
            descricao="Inativo não aparece para escalar. Desative em vez de excluir para manter o histórico."
            ligado={ativo}
            onChange={setAtivo}
          />
        )}
      </form>
    </Modal>
  )
}
