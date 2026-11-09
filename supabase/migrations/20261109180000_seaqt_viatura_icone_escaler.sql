-- Novo desenho de viatura: escaler (public/viaturas/escaler.webp).
alter table public.seaqt_viaturas
  drop constraint seaqt_viaturas_icone_valido,
  add constraint seaqt_viaturas_icone_valido check (icone in ('lancha', 'escaler', 'jet-ski', 'picape', 'caminhao'));
