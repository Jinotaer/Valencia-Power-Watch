-- Valencia PowerWatch — Admin seed
-- Run in the Supabase SQL Editor after supabase/user.sql.
--
-- 1. Create the admin user first:
--    Supabase Dashboard -> Authentication -> Users -> Add user,
--    or sign up through the app. Do not store the password in this repo.
--    NOTE: run supabase/user.sql (or at least the alter below) BEFORE
--    creating the auth user, otherwise the signup trigger inserts a NULL
--    id_number into the old NOT NULL column and the user creation fails.
-- 2. Replace admin@example.com below with that user's email.
-- 3. Run this file. It promotes the matching auth user to admin.

-- Compatibility for older user.sql versions: id_number used to be NOT NULL.
alter table public.users alter column id_number drop not null;

insert into public.users (id, id_number, email, full_name, role, contact_number, address)
select
  u.id,
  'VP-ADMIN-' || substr(u.id::text, 1, 6),
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin',
  u.raw_user_meta_data->>'contact_number',
  coalesce(u.raw_user_meta_data->>'barangay', u.raw_user_meta_data->>'address', '')
from auth.users u
where u.email = 'admin@example.com'
on conflict (id) do update
set
  id_number = coalesce(public.users.id_number, excluded.id_number),
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.users.full_name),
  role = 'admin',
  contact_number = coalesce(excluded.contact_number, public.users.contact_number),
  address = coalesce(excluded.address, public.users.address)
returning id, email, role;
