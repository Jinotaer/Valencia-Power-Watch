-- Valencia PowerWatch — User module
-- Run in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)

-- 1. Create public.users table (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid() references auth.users(id) on delete cascade,
  -- Residents have no ID number; only staff (and admins who elect one) carry a unique id
  id_number text unique,
  email text not null unique,
  full_name text,
  role text not null default 'resident'
    check (role in ('admin', 'staff', 'resident')),
  contact_number text,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists users_role_idx on public.users (role);

-- Residents are not issued an ID number: allow NULL and clear legacy auto codes
alter table public.users alter column id_number drop not null;
update public.users set id_number = null where role = 'resident' and id_number like 'VP-%';

-- Admin check used by RLS policies. security definer avoids recursive RLS on this table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevents unauthenticated calls from probing who claims to be an admin/staff.
-- Authenticated keeps EXECUTE via the default PUBLIC grant; policies run as the
-- calling user, so authenticated must keep execute.
revoke execute on function public.is_admin() from anon;

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

-- RLS Policies: Authenticated users can read and update their own record
create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- `role` is excluded from the column grants below, so nobody can promote
-- themselves to admin by updating their own row.
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id);

-- Admins can read every user (needed to assign field staff)
drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
  on public.users
  for select
  to authenticated
  using ((select public.is_admin()));

-- Editors may only change profile columns, never `role`
revoke update on public.users from authenticated;
grant update (id_number, full_name, contact_number, address) on public.users to authenticated;

-- 3. Automatic Trigger: Whenever a user signs up via auth.signUp(),
-- copy their information into public.users automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, id_number, email, full_name, role, contact_number, address)
  values (
    new.id,
    -- Only staff carry an ID number; residents are left NULL (no random code)
    case
      when new.raw_user_meta_data->>'id_number' is not null
        then new.raw_user_meta_data->>'id_number'
      when new.raw_user_meta_data->>'role' = 'staff'
        then 'VP-' || to_char(now(), 'YYMM') || '-' || substr(new.id::text, 1, 6)
      else null
    end,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- Signup metadata may only grant 'staff'; 'admin' is promoted by SQL (see §4)
    case when new.raw_user_meta_data->>'role' = 'staff' then 'staff' else 'resident' end,
    new.raw_user_meta_data->>'contact_number',
    coalesce(new.raw_user_meta_data->>'barangay', new.raw_user_meta_data->>'address', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    address = coalesce(excluded.address, public.users.address);
  return new;
end;
$$;

-- Recreate trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Promote a trusted user to admin (run as project owner in the SQL Editor):
-- update public.users set role = 'admin' where email = 'your-admin@email.com';
--
-- Signup metadata can never grant 'admin'; the trigger caps it at 'staff'. This
-- file must be at the top of the run order because it defines public.is_admin()
-- used by report.sql, barangay.sql and schedule.sql.
