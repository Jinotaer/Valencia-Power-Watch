-- Valencia PowerWatch — Users table (public.users)
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
  position text,
  is_active boolean not null default true,
  notification_preferences jsonb not null
    default '{"outageAlerts":true,"reportStatusUpdates":true,"scheduledReminders":false}'::jsonb,
  language text not null default 'en' check (language in ('en', 'fil', 'bce')),
  created_at timestamptz not null default now()
);

-- Migrations for existing databases
alter table public.users alter column id_number drop not null;
alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists position text;
alter table public.users
  add column if not exists notification_preferences jsonb not null
  default '{"outageAlerts":true,"reportStatusUpdates":true,"scheduledReminders":false}'::jsonb;
alter table public.users
  add column if not exists language text not null default 'en'
  check (language in ('en', 'fil', 'bce'));

update public.users set id_number = null where role = 'resident' and id_number like 'VP-%';

create index if not exists users_role_idx on public.users (role);
create index if not exists users_role_active_idx on public.users (role, is_active);

-- 2. Admin check used by RLS policies across all tables (security definer avoids recursive RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from anon;

-- 3. Row Level Security (RLS)
alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
  on public.users
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can update user profiles" on public.users;
create policy "Admins can update user profiles"
  on public.users
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Editors may only change profile columns, never `role` or `is_active` directly
revoke update on public.users from authenticated;
grant update (id_number, full_name, contact_number, address, position, notification_preferences, language) on public.users to authenticated;

-- 4. Admin-only activation toggle (is_active is not user-self-editable)
create or replace function public.set_user_active(p_user_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only administrators can change account status.';
  end if;

  update public.users set is_active = p_is_active where id = p_user_id;
  if not found then
    raise exception 'User not found.';
  end if;
end;
$$;

revoke execute on function public.set_user_active(uuid, boolean) from anon;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

-- 5. Automatic Trigger: Whenever a user signs up via auth.signUp(),
-- copy their information into public.users automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, id_number, email, full_name, role, contact_number, address, position)
  values (
    new.id,
    case
      when new.raw_user_meta_data->>'id_number' is not null
        then new.raw_user_meta_data->>'id_number'
      when new.raw_user_meta_data->>'role' = 'staff'
        then 'STF-' || substr(new.id::text, 1, 4)
      else null
    end,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'staff' then 'staff' else 'resident' end,
    new.raw_user_meta_data->>'contact_number',
    case
      when new.raw_user_meta_data->>'role' = 'staff' then null
      else coalesce(new.raw_user_meta_data->>'barangay', new.raw_user_meta_data->>'address', '')
    end,
    nullif(new.raw_user_meta_data->>'position', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    address = case
      when public.users.role = 'staff' then null
      else coalesce(excluded.address, public.users.address)
    end,
    position = coalesce(excluded.position, public.users.position);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
