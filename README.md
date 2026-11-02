# SEAQT · Checklist Operacional

Briefing diário do grupamento de mergulho (SEAQT/CBMDF), com duas visões do mesmo dado em tempo real:

| Visão | Endereço | Uso |
| --- | --- | --- |
| **Checklist** | `https://rafaelqcosta.github.io/seaqt-checklist/` | Militares preenchem pelo celular/computador |
| **Modo TV** | `https://rafaelqcosta.github.io/seaqt-checklist/#/tv` | Resumo em tela cheia na TV da sala (só leitura) |
| **Cadastros** | `…/#/cadastros` | Militares (com foto), viaturas e funções |

O login é o mesmo do **BUCOMAT** (mesmo projeto Supabase). Na TV, entre uma vez; a sessão fica salva.

Seções do briefing: condição do pessoal (apto/inapto/ausente), divisão das guarnições, meteorologia (automática,
Open-Meteo), contato com a hiperbárica, ordens de missão (com PDF), viaturas, material operacional (GRIFO),
sistemas CBMDF e combate a incêndio.

## Stack

React + TypeScript + Vite + Tailwind CSS, Supabase (Postgres, Auth, Realtime, Storage). Site estático publicado no
GitHub Pages por GitHub Actions a cada push na `main`.

## Banco de dados (projeto Supabase do BUCOMAT)

Tudo do SEAQT fica em tabelas `seaqt_*` e no bucket privado `seaqt`; nenhuma tabela do BUCOMAT é alterada. O login
(`auth.users`) é compartilhado.

| Tabela | Conteúdo |
| --- | --- |
| `seaqt_militares`, `seaqt_viaturas`, `seaqt_funcoes` | Cadastros persistentes |
| `seaqt_condicoes` | Equipe do dia e condição de cada militar |
| `seaqt_checklist` | Respostas do dia, uma linha por campo (guarnições, condutores, sim/não, observações) |
| `seaqt_ordens_missao` | OMs do dia (PDF no bucket `seaqt`, pasta `om/`) |

O "dia de serviço" vira às **07:00 de Brasília** (`HORA_TROCA_SERVICO` em `src/lib/constantes.ts`).

### Aplicar a migração no projeto do BUCOMAT

Opção 1 — painel: Supabase do BUCOMAT → **SQL Editor** → cole o conteúdo de
`supabase/migrations/20261028120000_seaqt_mvp.sql` → **Run**.

Opção 2 — CLI (sem trocar o login global do CLI): gere um token em *Account → Access Tokens* na conta do BUCOMAT e rode

```bash
SUPABASE_ACCESS_TOKEN=<token-da-conta-do-bucomat> supabase link --project-ref yjpqfukumgrowvxaumhu
```

```bash
SUPABASE_ACCESS_TOKEN=<token-da-conta-do-bucomat> supabase db push
```

(o `db push` pede a senha do banco).

## Desenvolvimento local

Requer Docker. O Supabase local deste projeto usa as portas 553xx (para não colidir com outros projetos).

```bash
supabase start
```

```bash
npm install && npm run dev
```

Abra `http://localhost:5180` e entre com o usuário de teste local `teste@seaqt.local` / `seaqt-local` (criado por
`supabase/seed.sql`, existe só no banco local). `supabase db reset` recria o banco local do zero.

`npm run dev` usa `.env.development.local` (Supabase local); `npm run build` usa `.env.production.local` (projeto do
BUCOMAT). Ambos ficam fora do git — veja `.env.example`.

## Deploy

Push na `main` → `.github/workflows/deploy.yml` gera o build e publica no GitHub Pages. O workflow lê
`vars.VITE_SUPABASE_URL` e `secrets.VITE_SUPABASE_PUBLISHABLE_KEY` (já configurados no repositório).
