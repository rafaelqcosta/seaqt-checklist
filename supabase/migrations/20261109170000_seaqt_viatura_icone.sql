-- Ícone opcional da viatura: um dos desenhos fixos em public/viaturas/<icone>.webp.
alter table public.seaqt_viaturas
  add column icone text
  constraint seaqt_viaturas_icone_valido check (icone in ('lancha', 'jet-ski', 'picape', 'caminhao'));
