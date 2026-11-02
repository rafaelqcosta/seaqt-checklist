-- SEAQT · Escala lida do BRADO
--
-- O BRADO é só fonte de leitura: quem está escalado no dia em cada lotação.
-- A leitura chega pelo userscript "ponte" (aba do BRADO -> aba do SEAQT) e é gravada
-- pelo próprio usuário logado no SEAQT. A condição de cada militar (apto, inapto, ausente)
-- continua sendo decidida no SEAQT, em seaqt_condicoes.

create table public.seaqt_escala_brado (
  data_servico date not null,
  -- codLotacao do BRADO (2016 = Merg. DELTA 1, 2015 = Merg. GBS)
  cod_lotacao integer not null,
  militar_id uuid not null references public.seaqt_militares (id) on delete cascade,
  -- Ex.: "08h00 às 20h00"
  turno text,
  -- Informação do BRADO para orientar o usuário (ex.: falta já lançada). Não decide nada.
  aviso text,
  -- Quando a escala foi lida no BRADO (pode ser antes de ser gravada aqui)
  lido_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por text,
  primary key (data_servico, cod_lotacao, militar_id)
);
create index seaqt_escala_brado_militar_idx on public.seaqt_escala_brado (militar_id);

create trigger seaqt_escala_brado_carimbo before insert or update on public.seaqt_escala_brado
  for each row execute function public.seaqt_carimbo();
alter table public.seaqt_escala_brado enable row level security;
revoke all on table public.seaqt_escala_brado from anon;
grant select, insert, update, delete on table public.seaqt_escala_brado to authenticated;
create policy seaqt_escala_brado_autenticados on public.seaqt_escala_brado
  for all to authenticated using (true) with check (true);

do $$
begin
  if not (select puballtables from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.seaqt_escala_brado;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- "1 SGT" -> "1º SGT", "TEN CEL" -> "TEN-CEL", como na lista de postos do SEAQT
-- ---------------------------------------------------------------------------
create or replace function public.seaqt_normalizar_posto(posto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p ~ '^\d\s*[º°]?\s*(SGT|TEN)$' then left(p, 1) || 'º ' || substring(p from '(SGT|TEN)$')
    when p in ('TEN CEL', 'TEN-CEL', 'TC') then 'TEN-CEL'
    when p in ('SUBTEN', 'SUB TEN') then 'ST'
    when p like 'ASP%' then 'ASP'
    else p
  end
  from (select upper(regexp_replace(trim(coalesce(posto, '')), '\s+', ' ', 'g')) as p) as normalizado;
$$;

-- ---------------------------------------------------------------------------
-- Substitui a escala lida de uma lotação num dia.
-- p_militares: [{ "matricula", "posto", "nomeGuerra", "turno", "aviso" }, ...]
-- Cada militar é achado pela matrícula; se não achar, pelo nome de guerra entre os
-- cadastrados sem matrícula (e a matrícula é completada). Quem não existe é cadastrado;
-- inativos são reativados. Devolve quantos militares ficaram na escala.
-- ---------------------------------------------------------------------------
create or replace function public.seaqt_registrar_escala_brado(
  p_data date,
  p_cod_lotacao integer,
  p_militares jsonb,
  p_lido_em timestamptz default now()
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  v_matricula text;
  v_nome text;
  v_militar uuid;
  v_ids uuid[] := '{}';
begin
  for item in select value from jsonb_array_elements(coalesce(p_militares, '[]'::jsonb)) loop
    v_matricula := nullif(regexp_replace(coalesce(item ->> 'matricula', ''), '\D', '', 'g'), '');
    v_nome := upper(trim(coalesce(item ->> 'nomeGuerra', '')));
    continue when v_nome = '';

    v_militar := null;
    if v_matricula is not null then
      select id into v_militar from public.seaqt_militares
        where regexp_replace(coalesce(matricula, ''), '\D', '', 'g') = v_matricula
        limit 1;
    end if;
    if v_militar is null then
      select id into v_militar from public.seaqt_militares
        where coalesce(matricula, '') = '' and upper(nome_guerra) = v_nome
        limit 1;
    end if;

    if v_militar is null then
      insert into public.seaqt_militares (posto_graduacao, nome_guerra, matricula)
        values (public.seaqt_normalizar_posto(item ->> 'posto'), v_nome, v_matricula)
        returning id into v_militar;
    else
      update public.seaqt_militares
        set ativo = true, matricula = coalesce(nullif(matricula, ''), v_matricula)
        where id = v_militar and (not ativo or coalesce(matricula, '') = '');
    end if;

    continue when v_militar = any (v_ids);
    v_ids := v_ids || v_militar;

    insert into public.seaqt_escala_brado (data_servico, cod_lotacao, militar_id, turno, aviso, lido_em)
      values (p_data, p_cod_lotacao, v_militar, item ->> 'turno', nullif(item ->> 'aviso', ''), p_lido_em)
      on conflict (data_servico, cod_lotacao, militar_id)
      do update set turno = excluded.turno, aviso = excluded.aviso, lido_em = excluded.lido_em;
  end loop;

  -- quem saiu da escala no BRADO sai daqui também (a condição registrada no SEAQT fica)
  delete from public.seaqt_escala_brado
    where data_servico = p_data and cod_lotacao = p_cod_lotacao and not (militar_id = any (v_ids));

  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

revoke all on function public.seaqt_registrar_escala_brado(date, integer, jsonb, timestamptz) from public, anon;
grant execute on function public.seaqt_registrar_escala_brado(date, integer, jsonb, timestamptz) to authenticated;
