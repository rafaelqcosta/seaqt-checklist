-- Link de localização (Google Maps) da ordem de missão. Só http(s): o link vira um <a href> no painel.
alter table public.seaqt_ordens_missao
  add column link_mapa text
  constraint seaqt_ordens_missao_link_mapa_http check (link_mapa ~* '^https?://');
