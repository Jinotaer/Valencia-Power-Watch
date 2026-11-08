-- Valencia PowerWatch — Schedule module
-- Run in the Supabase SQL Editor after user.sql

-- 1. Planned outage notices created by admins
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  barangay text,
  date date not null,
  start_time text not null,
  end_time text not null,
  type text not null default 'Maintenance',
  description text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'published', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Existing installs: schedules now have a title, and a barangay only applies
-- to outages limited to one barangay (empty = multiple barangays).
alter table public.schedules
  add column if not exists title text;

alter table public.schedules
  add column if not exists description text;

alter table public.schedules
  alter column barangay drop not null;

-- Location is no longer part of a schedule; drop it from existing installs.
alter table public.schedules
  drop column if exists location;

create index if not exists schedules_status_date_idx
  on public.schedules (status, date);

-- 2. RLS: residents read published notices, admins manage everything
alter table public.schedules enable row level security;

-- Admin helper (same definition as user.sql) so this file can run on its own
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

drop policy if exists "Anyone can read published schedules" on public.schedules;
create policy "Anyone can read published schedules"
  on public.schedules
  for select
  using (status = 'published');

drop policy if exists "Admins can manage schedules" on public.schedules;
create policy "Admins can manage schedules"
  on public.schedules
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
