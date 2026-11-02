-- SEAQT · Checklist Operacional (MVP)
--
-- Tabelas exclusivas do SEAQT, prefixadas com seaqt_, no mesmo projeto Supabase do BUCOMAT.
-- Nenhuma tabela do BUCOMAT é alterada; o login (auth.users) é compartilhado.
-- Acesso: qualquer usuário autenticado do projeto. O cadastro público do Auth está desligado,
-- então só entra quem foi criado pelo administrador.
--
-- Dados do dia são chaveados por data_servico (o dia de serviço vira às 07:00 de Brasília,
-- regra aplicada no front-end).

-- ---------------------------------------------------------------------------
-- Carimbo de alteração (quando e quem)
-- ---------------------------------------------------------------------------
create or replace function public.seaqt_carimbo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  new.atualizado_por := coalesce(auth.jwt() ->> 'email', new.atualizado_por);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cadastros (persistentes)
-- ---------------------------------------------------------------------------
create table public.seaqt_militares (
  id uuid primary key default gen_random_uuid(),
  posto_graduacao text not null,
  nome_guerra text not null,
  matricula text,
  foto_path text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);

create table public.seaqt_viaturas (
  id uuid primary key default gen_random_uuid(),
  prefixo text not null unique,
  descricao text,
  base text not null default 'BUC' check (base in ('BUC', 'GBS')),
  ativa boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);

create table public.seaqt_funcoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem integer not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);

-- ---------------------------------------------------------------------------
-- Dados do dia de serviço
-- ---------------------------------------------------------------------------

-- Equipe do dia e condição de cada militar (linha existe = militar está no serviço do dia)
create table public.seaqt_condicoes (
  data_servico date not null,
  militar_id uuid not null references public.seaqt_militares (id) on delete cascade,
  status text check (status in ('apto', 'inapto', 'ausente')),
  observacao text,
  atualizado_em timestamptz not null default now(),
  atualizado_por text,
  primary key (data_servico, militar_id)
);
create index seaqt_condicoes_militar_idx on public.seaqt_condicoes (militar_id);

-- Respostas do checklist do dia, uma linha por campo (evita sobrescrita entre usuários).
-- Chaves usadas pelo front-end:
--   guarnicao:<funcao_id>  -> uuid[] de militares
--   viatura:<viatura_id>   -> uuid[] de condutores
--   hiperbarica.contato | material.grifo | incendio.operacional | sistemas.<item> -> boolean
--   hiperbarica.hospital | hiperbarica.obs | material.obs | incendio.obs        -> texto
create table public.seaqt_checklist (
  data_servico date not null,
  chave text not null,
  valor jsonb,
  atualizado_em timestamptz not null default now(),
  atualizado_por text,
  primary key (data_servico, chave)
);

create table public.seaqt_ordens_missao (
  id uuid primary key default gen_random_uuid(),
  data_servico date not null,
  titulo text not null,
  horario time,
  local text,
  arquivo_path text,
  arquivo_nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);
create index seaqt_ordens_missao_data_idx on public.seaqt_ordens_missao (data_servico);

-- ---------------------------------------------------------------------------
-- Carimbo, permissões e RLS
-- ---------------------------------------------------------------------------
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'seaqt_militares', 'seaqt_viaturas', 'seaqt_funcoes',
    'seaqt_condicoes', 'seaqt_checklist', 'seaqt_ordens_missao'
  ] loop
    execute format(
      'create trigger %1$s_carimbo before insert or update on public.%1$I
         for each row execute function public.seaqt_carimbo()', tabela);
    execute format('alter table public.%I enable row level security', tabela);
    execute format('revoke all on table public.%I from anon', tabela);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tabela);
    execute format(
      'create policy %1$s_autenticados on public.%1$I
         for all to authenticated using (true) with check (true)', tabela);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime (TV atualiza sozinha)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not (select puballtables from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.seaqt_militares, public.seaqt_viaturas, public.seaqt_funcoes,
      public.seaqt_condicoes, public.seaqt_checklist, public.seaqt_ordens_missao;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para fotos dos militares (fotos/) e PDFs das OMs (om/)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seaqt', 'seaqt', false, 20971520,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy seaqt_arquivos_select on storage.objects
  for select to authenticated using (bucket_id = 'seaqt');
create policy seaqt_arquivos_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'seaqt');
create policy seaqt_arquivos_update on storage.objects
  for update to authenticated using (bucket_id = 'seaqt') with check (bucket_id = 'seaqt');
create policy seaqt_arquivos_delete on storage.objects
  for delete to authenticated using (bucket_id = 'seaqt');

-- ---------------------------------------------------------------------------
-- Dados iniciais de configuração (editáveis em Cadastros)
-- ---------------------------------------------------------------------------
insert into public.seaqt_funcoes (nome, ordem) values
  ('1ª Dupla de Mergulho', 10),
  ('Condutor da Embarcação Principal', 20),
  ('Condutor da Moto Aquática', 30),
  ('Passageiro da MA · Guarda-Vidas / Cabo de Fundo', 40),
  ('Composição da Viatura (via terrestre)', 50);

insert into public.seaqt_viaturas (prefixo, descricao, base, ordem) values
  ('MA8', 'Moto aquática', 'BUC', 10),
  ('L15', 'Lancha', 'BUC', 20),
  ('L13', 'Lancha', 'GBS', 30),
  ('E11', 'Viatura terrestre', 'BUC', 40);
