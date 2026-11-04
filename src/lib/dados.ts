import { redimensionarImagem } from './arquivos'
import { ordenarMilitares } from './militares'
import { BUCKET, supabase } from './supabase'
import type {
  Cadastros,
  Condicao,
  DadosDia,
  EscalaBrado,
  Funcao,
  ItemChecklist,
  Militar,
  MilitarBrado,
  NovaOrdem,
  OrdemMissao,
  Viatura,
} from './tipos'

export const TABELAS = [
  'seaqt_militares',
  'seaqt_viaturas',
  'seaqt_funcoes',
  'seaqt_condicoes',
  'seaqt_checklist',
  'seaqt_ordens_missao',
  'seaqt_escala_brado',
] as const

function verificar<T>(resposta: { data: T; error: unknown }): T {
  if (resposta.error) throw resposta.error
  return resposta.data
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export async function buscarCadastros(): Promise<Cadastros> {
  const [militares, viaturas, funcoes] = await Promise.all([
    supabase.from('seaqt_militares').select('id, posto_graduacao, nome_guerra, matricula, foto_path, ativo'),
    supabase.from('seaqt_viaturas').select('id, prefixo, descricao, base, ativa, ordem').order('ordem').order('prefixo'),
    supabase.from('seaqt_funcoes').select('id, nome, ordem, ativa').order('ordem').order('nome'),
  ])
  return {
    militares: ordenarMilitares(verificar(militares) as Militar[]),
    viaturas: verificar(viaturas) as Viatura[],
    funcoes: verificar(funcoes) as Funcao[],
  }
}

export async function buscarDia(data: string): Promise<DadosDia> {
  const [condicoes, escalaBrado, checklist, ordens] = await Promise.all([
    supabase.from('seaqt_condicoes').select('*').eq('data_servico', data),
    supabase
      .from('seaqt_escala_brado')
      .select('data_servico, cod_lotacao, militar_id, turno, aviso, lido_em')
      .eq('data_servico', data),
    supabase.from('seaqt_checklist').select('*').eq('data_servico', data),
    supabase
      .from('seaqt_ordens_missao')
      .select('*')
      .eq('data_servico', data)
      .order('horario', { ascending: true, nullsFirst: false })
      .order('criado_em'),
  ])
  return {
    data,
    condicoes: verificar(condicoes) as Condicao[],
    escalaBrado: verificar(escalaBrado) as EscalaBrado[],
    checklist: Object.fromEntries((verificar(checklist) as ItemChecklist[]).map((item) => [item.chave, item])),
    ordens: verificar(ordens) as OrdemMissao[],
  }
}

// ---------------------------------------------------------------------------
// Dia de serviço
// ---------------------------------------------------------------------------

export async function salvarValor(data: string, chave: string, valor: unknown): Promise<void> {
  verificar(await supabase.from('seaqt_checklist').upsert({ data_servico: data, chave, valor }))
}

export async function salvarCondicao(
  data: string,
  militarId: string,
  campos: Partial<Pick<Condicao, 'status' | 'observacao'>>,
  /** Militar escalado no BRADO que ainda não tem condição registrada: cria a linha. */
  criar = false,
): Promise<void> {
  if (criar) {
    verificar(await supabase.from('seaqt_condicoes').upsert({ data_servico: data, militar_id: militarId, ...campos }))
    return
  }
  // update (não upsert): se outro usuário acabou de tirar o militar da equipe, ele não volta sozinho
  verificar(
    await supabase.from('seaqt_condicoes').update(campos).eq('data_servico', data).eq('militar_id', militarId),
  )
}

export async function adicionarNaEquipe(data: string, militarIds: string[]): Promise<void> {
  if (militarIds.length === 0) return
  verificar(
    await supabase
      .from('seaqt_condicoes')
      .upsert(militarIds.map((id) => ({ data_servico: data, militar_id: id })), { ignoreDuplicates: true }),
  )
}

export async function removerDaEquipe(data: string, militarId: string): Promise<void> {
  verificar(await supabase.from('seaqt_condicoes').delete().eq('data_servico', data).eq('militar_id', militarId))
}

/** Substitui a escala lida do BRADO de uma lotação no dia (cadastra militares que faltarem). */
export async function registrarEscalaBrado(
  data: string,
  codLotacao: number,
  militares: MilitarBrado[],
  lidoEm: string,
): Promise<void> {
  verificar(
    await supabase.rpc('seaqt_registrar_escala_brado', {
      p_data: data,
      p_cod_lotacao: codLotacao,
      // a foto não vai para a função do banco: é copiada à parte (copiarFotosBrado)
      p_militares: militares.map(({ foto: _foto, ...militar }) => militar),
      p_lido_em: lidoEm,
    }),
  )
}

const somenteDigitos = (texto: string) => texto.replace(/\D/g, '')

/**
 * Grava a foto vinda do BRADO para os militares (achados pela matrícula) que ainda não têm foto.
 * Foto já cadastrada nunca é trocada. Devolve quantas fotos foram copiadas.
 */
export async function copiarFotosBrado(militares: MilitarBrado[]): Promise<number> {
  const fotoPorMatricula = new Map(
    militares.flatMap((militar) => (militar.foto && somenteDigitos(militar.matricula) ? [[somenteDigitos(militar.matricula), militar.foto]] : [])),
  )
  if (fotoPorMatricula.size === 0) return 0

  const semFoto = verificar(
    await supabase.from('seaqt_militares').select('id, matricula').is('foto_path', null),
  ) as Pick<Militar, 'id' | 'matricula'>[]
  let copiadas = 0
  for (const militar of semFoto) {
    const foto = fotoPorMatricula.get(somenteDigitos(militar.matricula ?? ''))
    if (!foto) continue
    const caminho = `fotos/${crypto.randomUUID()}.jpg`
    const imagem = await redimensionarImagem(await (await fetch(foto)).blob())
    verificar(await supabase.storage.from(BUCKET).upload(caminho, imagem, { contentType: 'image/jpeg' }))
    // is(foto_path, null): se alguém cadastrou uma foto nesse meio-tempo, ela fica
    const atualizados = verificar(
      await supabase.from('seaqt_militares').update({ foto_path: caminho }).eq('id', militar.id).is('foto_path', null).select('id'),
    )
    if (!atualizados?.length) await supabase.storage.from(BUCKET).remove([caminho])
    else copiadas++
  }
  return copiadas
}

export async function criarOrdem(data: string, campos: NovaOrdem, pdf?: File | null): Promise<void> {
  let arquivo_path: string | null = null
  if (pdf) {
    arquivo_path = `om/${data}/${crypto.randomUUID()}.pdf`
    verificar(await supabase.storage.from(BUCKET).upload(arquivo_path, pdf, { contentType: 'application/pdf' }))
  }
  const resposta = await supabase.from('seaqt_ordens_missao').insert({
    data_servico: data,
    ...campos,
    arquivo_path,
    arquivo_nome: pdf?.name ?? null,
  })
  if (resposta.error && arquivo_path) await supabase.storage.from(BUCKET).remove([arquivo_path])
  verificar(resposta)
}

export async function excluirOrdem(ordem: OrdemMissao): Promise<void> {
  verificar(await supabase.from('seaqt_ordens_missao').delete().eq('id', ordem.id))
  if (ordem.arquivo_path) await supabase.storage.from(BUCKET).remove([ordem.arquivo_path])
}

// ---------------------------------------------------------------------------
// Cadastros
// ---------------------------------------------------------------------------

export type CamposMilitar = Pick<Militar, 'posto_graduacao' | 'nome_guerra' | 'matricula' | 'ativo'>

/**
 * Cria (sem id) ou atualiza um militar; a foto, se enviada, substitui a anterior.
 * A foto sobe antes do registro: se ela falhar, nenhum militar fica criado pela metade.
 */
export async function salvarMilitar(
  campos: Partial<CamposMilitar> & { id?: string },
  foto?: File | null,
): Promise<void> {
  const { id, ...resto } = campos
  let novaFoto: string | null = null
  if (foto) {
    novaFoto = `fotos/${crypto.randomUUID()}.jpg`
    const imagem = await redimensionarImagem(foto)
    verificar(await supabase.storage.from(BUCKET).upload(novaFoto, imagem, { contentType: 'image/jpeg' }))
  }
  const registro = novaFoto ? { ...resto, foto_path: novaFoto } : resto

  try {
    if (!id) {
      verificar(await supabase.from('seaqt_militares').insert(registro))
      return
    }
    const anterior = verificar(
      await supabase.from('seaqt_militares').select('foto_path').eq('id', id).single(),
    ) as Pick<Militar, 'foto_path'>
    verificar(await supabase.from('seaqt_militares').update(registro).eq('id', id))
    if (novaFoto && anterior.foto_path) await supabase.storage.from(BUCKET).remove([anterior.foto_path])
  } catch (erro) {
    if (novaFoto) await supabase.storage.from(BUCKET).remove([novaFoto])
    throw erro
  }
}

export async function salvarViatura(campos: Partial<Omit<Viatura, 'id'>> & { id?: string }): Promise<void> {
  const { id, ...resto } = campos
  verificar(
    id
      ? await supabase.from('seaqt_viaturas').update(resto).eq('id', id)
      : await supabase.from('seaqt_viaturas').insert(resto),
  )
}

export async function excluirViatura(id: string): Promise<void> {
  verificar(await supabase.from('seaqt_viaturas').delete().eq('id', id))
}

export async function salvarFuncao(campos: Partial<Omit<Funcao, 'id'>> & { id?: string }): Promise<void> {
  const { id, ...resto } = campos
  verificar(
    id
      ? await supabase.from('seaqt_funcoes').update(resto).eq('id', id)
      : await supabase.from('seaqt_funcoes').insert(resto),
  )
}

export async function excluirFuncao(id: string): Promise<void> {
  verificar(await supabase.from('seaqt_funcoes').delete().eq('id', id))
}
