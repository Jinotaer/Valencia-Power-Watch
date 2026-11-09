-- Valencia PowerWatch — Report Categories table (public.report_categories)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. Report categories catalog
create table if not exists public.report_categories (
  id uuid primary key default gen_random_uuid(),
  value text unique not null check (value in (
    'line-fault', 'transformer-issue', 'weather-disturbance',
    'power-supply-interruption', 'equipment-related', 'scheduled-maintenance',
    'unknown', 'other'
  )),
  label text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists report_categories_sort_idx
  on public.report_categories (sort_order, label);

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

alter table public.report_categories enable row level security;

drop policy if exists "Anyone can read report categories" on public.report_categories;
create policy "Anyone can read report categories"
  on public.report_categories
  for select
  using (true);

drop policy if exists "Admins can manage report categories" on public.report_categories;
create policy "Admins can manage report categories"
  on public.report_categories
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.report_categories to anon, authenticated;
grant insert, update, delete on public.report_categories to authenticated;

-- 3. Default report category seeds
insert into public.report_categories (value, label, description, sort_order) values
  ('line-fault', 'Line Fault', 'Downed lines, pole or cable damage', 10),
  ('transformer-issue', 'Transformer Issue', 'Transformer fault or failure', 20),
  ('weather-disturbance', 'Weather Disturbance', 'Storm, flood, lightning or wind damage', 30),
  ('power-supply-interruption', 'Power Supply Interruption', 'No power or partial outage', 40),
  ('equipment-related', 'Equipment-related', 'Meter, switch or other equipment issue', 50),
  ('scheduled-maintenance', 'Scheduled Maintenance', 'Planned maintenance or repair work', 60),
  ('unknown', 'Unknown', 'Issue type is not yet identified', 70),
  ('other', 'Other', 'Other power interruption', 80)
on conflict (value) do nothing;
