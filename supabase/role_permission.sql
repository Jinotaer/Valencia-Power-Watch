-- Valencia PowerWatch — Role Permissions table (public.role_permissions)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. Role permissions matrix
create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'staff', 'resident')),
  permission text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (role, permission)
);

-- 2. Row Level Security (RLS)
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

alter table public.role_permissions enable row level security;

drop policy if exists "Anyone can read role permissions" on public.role_permissions;
create policy "Anyone can read role permissions"
  on public.role_permissions
  for select
  using (true);

drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions"
  on public.role_permissions
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.role_permissions to anon, authenticated;
grant insert, update, delete on public.role_permissions to authenticated;

-- 3. Default role permission seeds
insert into public.role_permissions (role, permission, enabled) values
  ('admin', 'admin_console', true),
  ('admin', 'manage_users', true),
  ('admin', 'manage_barangays', true),
  ('admin', 'manage_reports', true),
  ('admin', 'verify_reports', true),
  ('admin', 'assign_staff', true),
  ('admin', 'manage_schedules', true),
  ('admin', 'manage_announcements', true),
  ('admin', 'manage_notifications', true),
  ('admin', 'manage_settings', true),
  ('staff', 'view_assigned_reports', true),
  ('staff', 'update_assigned_reports', true),
  ('staff', 'view_schedules', true),
  ('staff', 'view_map', true),
  ('resident', 'submit_reports', true),
  ('resident', 'view_own_reports', true),
  ('resident', 'view_public_map', true),
  ('resident', 'view_announcements', true),
  ('resident', 'view_schedules', true),
  ('resident', 'send_feedback', true)
on conflict (role, permission) do nothing;
