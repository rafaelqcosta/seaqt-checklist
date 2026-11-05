export const FUSO = 'America/Sao_Paulo'

/** Hora (Brasília) em que o dia de serviço vira. Antes disso, vale o serviço do dia anterior. */
export const HORA_TROCA_SERVICO = 7

/** Ordem hierárquica usada para ordenar a tropa. */
export const POSTOS = [
  'CEL', 'TEN-CEL', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
  'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD',
] as const

export const BASES = ['BUC', 'GBS'] as const

/** Lotações lidas do BRADO (codLotacao -> sigla curta). Mesma lista no userscript da ponte. */
export const LOTACOES_BRADO: Record<number, string> = {
  2016: 'DELTA 1',
  2015: 'GBS',
}

/** Ponto de referência para a meteorologia (Open-Meteo, sem chave de API). */
export const LOCAL_METEO = { nome: 'Lago Paranoá', latitude: -15.8, longitude: -47.83 }

export const SISTEMAS_CBMDF = [
  { chave: 'sistemas.livro_mestre_lancha', rotulo: 'Livro Mestre de Lancha', curto: 'Livro Mestre' },
  { chave: 'sistemas.relatorio_ocorrencias', rotulo: 'Relatório de Ocorrências', curto: 'Rel. Ocorrências' },
  { chave: 'sistemas.relatorio_oms', rotulo: 'Relatório de OMs', curto: 'Rel. OMs' },
  { chave: 'sistemas.livro_dia_deposito', rotulo: 'Livro Dia ao Depósito', curto: 'Livro Dia' },
  { chave: 'sistemas.sinespcad', rotulo: 'Atualização SinespCAD Operacional', curto: 'SinespCAD' },
] as const

/** Chaves de seaqt_checklist (uma linha por campo do dia). */
export const CHAVES = {
  hiperbaricaContato: 'hiperbarica.contato',
  hiperbaricaHospital: 'hiperbarica.hospital',
  hiperbaricaObs: 'hiperbarica.obs',
  materialGrifo: 'material.grifo',
  materialObs: 'material.obs',
  incendioOperacional: 'incendio.operacional',
  incendioObs: 'incendio.obs',
  guarnicao: (funcaoId: string) => `guarnicao:${funcaoId}`,
  viatura: (viaturaId: string) => `viatura:${viaturaId}`,
  /** true = viatura em serviço no dia (só vale para viatura ativa no cadastro). */
  viaturaServico: (viaturaId: string) => `viatura_servico:${viaturaId}`,
} as const
