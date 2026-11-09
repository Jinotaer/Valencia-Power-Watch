-- Valencia PowerWatch — Announcements table (public.announcements)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. Announcements (official advisories, maintenance and restoration news)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  barangay text,
  category text not null default 'advisory'
    check (category in ('advisory', 'maintenance', 'restoration', 'general')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists announcements_published_idx
  on public.announcements (published_at desc);

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

alter table public.announcements enable row level security;

drop policy if exists "Anyone can read published announcements" on public.announcements;
create policy "Anyone can read published announcements"
  on public.announcements
  for select
  using (true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

-- 3. Seed advisories (guarded so re-runs do not duplicate them)
insert into public.announcements (title, body, category, published_at)
select 'Welcome to PowerWatch Valencia City',
       'Report outages and follow power updates for your barangay right here. Your report goes straight to the city response team.',
       'general', now() - interval '6 days'
where not exists (select 1 from public.announcements where title = 'Welcome to PowerWatch Valencia City');

insert into public.announcements (title, body, category, published_at)
select 'Stay safe around downed lines',
       'If you see a fallen wire or sparks, keep at least 10 meters away and call the local emergency number. Report it here so crews can be dispatched.',
       'advisory', now() - interval '4 days'
where not exists (select 1 from public.announcements where title = 'Stay safe around downed lines');

insert into public.announcements (title, body, category, published_at)
select 'Scheduled maintenance notices',
       'Planned interruptions published by the utility appear on the Schedules page and on the map. Restoration follows the times shown there.',
       'maintenance', now() - interval '2 days'
where not exists (select 1 from public.announcements where title = 'Scheduled maintenance notices');
