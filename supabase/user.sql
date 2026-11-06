-- Valencia PowerWatch — User module
-- Run in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)

-- 1. Create public.users table (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid() references auth.users(id) on delete cascade,
  id_number text not null unique,
  email text not null unique,
  full_name text,
  role text not null default 'resident'
    check (role in ('admin', 'staff', 'resident')),
  contact_number text,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists users_role_idx on public.users (role);

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

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

-- RLS Policies: Authenticated users can read and update their own record
create policy "Users can read own profile"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id);

-- Admins can read every user (needed to assign field staff)
drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
  on public.users
  for select
  using (public.is_admin());

-- 3. Automatic Trigger: Whenever a user signs up via auth.signUp(),
-- copy their information into public.users automatically.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, id_number, email, full_name, role, contact_number, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'id_number', 'VP-' || to_char(now(), 'YYMM') || '-' || substr(new.id::text, 1, 6)),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'resident'),
    new.raw_user_meta_data->>'contact_number',
    coalesce(new.raw_user_meta_data->>'barangay', new.raw_user_meta_data->>'address', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    role = coalesce(excluded.role, public.users.role),
    address = coalesce(excluded.address, public.users.address);
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Helper query to promote a user to admin or staff:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'your-admin@email.com';
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';
