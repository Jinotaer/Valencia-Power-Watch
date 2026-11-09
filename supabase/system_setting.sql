-- Valencia PowerWatch — System Settings table (public.system_settings)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. System settings key-value store
create table if not exists public.system_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
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

alter table public.system_settings enable row level security;

drop policy if exists "Anyone can read system settings" on public.system_settings;
create policy "Anyone can read system settings"
  on public.system_settings
  for select
  using (true);

drop policy if exists "Admins can manage system settings" on public.system_settings;
create policy "Admins can manage system settings"
  on public.system_settings
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.system_settings to anon, authenticated;
grant insert, update, delete on public.system_settings to authenticated;

-- 3. Default settings seeds
insert into public.system_settings (key, value, description) values
  ('app_name', 'Valencia PowerWatch', 'Public application name'),
  ('support_email', 'support@valenciacity.example', 'Public support email'),
  ('support_phone', '+63 900 000 0000', 'Public support phone'),
  ('emergency_notice', 'If you see a fallen wire or sparks, keep at least 10 meters away and call the local emergency number.', 'Shown in report safety guidance'),
  ('maintenance_message', 'PowerWatch is under routine maintenance. Access may be intermittent.', 'Optional maintenance banner'),
  ('maintenance_mode', 'false', 'Set true to show the maintenance message in the portal'),
  ('notification_retention_days', '90', 'Days to retain notification delivery history')
on conflict (key) do update set
  description = excluded.description;
