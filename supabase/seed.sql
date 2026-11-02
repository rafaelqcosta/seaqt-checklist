-- Dados fictícios, só para desenvolvimento local (supabase db reset). Não vão para produção.
insert into public.seaqt_militares (posto_graduacao, nome_guerra, matricula) values
  ('1º TEN', 'ALFA', '000.001-1'),
  ('1º SGT', 'BRAVO', '000.002-2'),
  ('2º SGT', 'CHARLIE', '000.003-3'),
  ('3º SGT', 'DELTA', '000.004-4'),
  ('3º SGT', 'ECHO', '000.005-5'),
  ('CB', 'FOXTROT', '000.006-6'),
  ('SD', 'GOLF', '000.007-7'),
  ('SD', 'HOTEL', '000.008-8');

-- Usuário de teste local (só no supabase local): teste@seaqt.local / seaqt-local
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'teste@seaqt.local',
  extensions.crypt('seaqt-local', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"teste@seaqt.local"}', 'email', now(), now(), now()
);
