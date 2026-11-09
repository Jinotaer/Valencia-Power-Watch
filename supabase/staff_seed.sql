-- Valencia PowerWatch: Staff seed (2 accounts)
-- Run in the Supabase SQL Editor after supabase/user.sql.
--
-- 1. Change the emails, names, and temporary password below.
-- 2. Run this file. It creates the auth users (if missing), then promotes
--    them to staff in public.users.
-- 3. Have each staff member sign in and change their password.
-- Do not commit real passwords to the repo.

-- Compatibility for older user.sql versions: id_number used to be NOT NULL.
-- This must run BEFORE the auth users are created, or the signup trigger fails.
alter table public.users alter column id_number drop not null;

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  temp_password text := 'ChangeMe_2026!';   -- temporary, change after first login
  s record;
  new_id uuid;
begin
  for s in
    select * from (values
      ('staff1@example.com', 'Ramon Santos', 'STF-0101'),
      ('staff2@example.com', 'Carlo Mendoza', 'STF-0102')
    ) as t(email, full_name, id_number)
  loop
    if not exists (select 1 from auth.users where email = s.email) then
      new_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
        s.email, extensions.crypt(temp_password, extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"],"role":"staff"}'::jsonb,
        jsonb_build_object('full_name', s.full_name, 'role', 'staff', 'id_number', s.id_number),
        now(), now(),
        '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), new_id, new_id::text,
        jsonb_build_object('sub', new_id::text, 'email', s.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    end if;
  end loop;
end $$;

insert into public.users (id, id_number, email, full_name, role, contact_number, address)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'id_number', 'STF-' || substr(u.id::text, 1, 4)),
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'staff',
  u.raw_user_meta_data->>'contact_number',
  null
from auth.users u
where u.email in ('staff1@example.com', 'staff2@example.com')
on conflict (id) do update
set
  id_number = coalesce(public.users.id_number, excluded.id_number),
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.users.full_name),
  role = 'staff',
  contact_number = coalesce(excluded.contact_number, public.users.contact_number),
  address = null
returning id, id_number, email, role;
