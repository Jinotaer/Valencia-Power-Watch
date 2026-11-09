-- Valencia PowerWatch: Admin seed
-- Run in the Supabase SQL Editor after supabase/user.sql.
--
-- 1. Change the email and the temporary password below.
-- 2. Run this file. It creates the auth user (if missing), then promotes
--    the matching user to admin in public.users.
-- 3. Sign in and change the password right away.
-- Do not commit the real password to the repo.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  admin_email    text := 'admin@gmail.com';
  admin_password text := 'qwertyuiop12345';   -- temporary, change after first login
  admin_name     text := 'System Administrator';
  admin_id_num   text := 'ADM-0001';
  new_id         uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = admin_email) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      admin_email, extensions.crypt(admin_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      jsonb_build_object('full_name', admin_name, 'role', 'admin', 'id_number', admin_id_num),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), new_id, new_id::text,
      jsonb_build_object('sub', new_id::text, 'email', admin_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
end $$;

insert into public.users (id, id_number, email, full_name, role, contact_number, address)
select
  id,
  'ADM-0001',
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'admin',
  raw_user_meta_data->>'contact_number',
  null
from auth.users
where email = 'admin@gmail.com'
on conflict (id) do update
set
  id_number = coalesce(public.users.id_number, excluded.id_number),
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.users.full_name),
  role = 'admin',
  contact_number = coalesce(excluded.contact_number, public.users.contact_number),
  address = null
returning id, id_number, email, role;
