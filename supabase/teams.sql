-- Valencia PowerWatch — Field Teams Schema & Policies (public.teams)
-- Run this in the Supabase SQL Editor

-- 1. Create teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  leader_id uuid references auth.users(id) on delete set null,
  contact_number text,
  vehicle_plate text,
  status text not null default 'available' check (status in ('available', 'dispatched', 'offline')),
  last_known_location jsonb default null, -- { latitude, longitude, updated_at, heading }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teams_leader_idx on public.teams (leader_id);
create index if not exists teams_status_idx on public.teams (status);

-- 2. Link staff users to teams
alter table public.users add column if not exists team_id uuid references public.teams(id) on delete set null;
create index if not exists users_team_idx on public.users (team_id);

-- Grant update on team_id to authenticated users (admins can assign staff to teams)
grant update (team_id) on public.users to authenticated;

-- Helper RPC for assigning a staff member to a team (security definer)
create or replace function public.assign_staff_team(p_user_id uuid, p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only administrators can assign staff teams.';
  end if;

  update public.users
  set team_id = p_team_id
  where id = p_user_id;
end;
$$;

grant execute on function public.assign_staff_team(uuid, uuid) to authenticated;

-- 3. Link reports to teams & track which crew member resolved
alter table public.reports add column if not exists assigned_team_id uuid references public.teams(id) on delete set null;
alter table public.reports add column if not exists resolved_by_staff_id uuid references auth.users(id) on delete set null;
create index if not exists reports_assigned_team_idx on public.reports (assigned_team_id);
create index if not exists reports_resolved_by_idx on public.reports (resolved_by_staff_id);

-- 4. Enable Row Level Security (RLS) on teams
alter table public.teams enable row level security;

-- Admins have full access to teams
drop policy if exists "Admins can manage teams" on public.teams;
create policy "Admins can manage teams"
  on public.teams
  for all
  to authenticated
  using ((select public.is_admin()));

-- Authenticated users (staff, admins, residents) can view teams
drop policy if exists "Authenticated users can view teams" on public.teams;
create policy "Authenticated users can view teams"
  on public.teams
  for select
  to authenticated
  using (true);

-- Staff can update their own team's location and status
drop policy if exists "Staff can update own team location" on public.teams;
create policy "Staff can update own team location"
  on public.teams
  for update
  to authenticated
  using (
    id in (select team_id from public.users where id = (select auth.uid()))
  )
  with check (
    id in (select team_id from public.users where id = (select auth.uid()))
  );

grant select, insert, update, delete on public.teams to authenticated;

-- 5. Update Reports RLS policies for team-based dispatch
drop policy if exists "Team members can view assigned reports" on public.reports;
create policy "Team members can view assigned reports"
  on public.reports
  for select
  to authenticated
  using (
    assigned_team_id is not null
    and assigned_team_id in (select team_id from public.users where id = (select auth.uid()))
  );

drop policy if exists "Team members can update assigned reports" on public.reports;
create policy "Team members can update assigned reports"
  on public.reports
  for update
  to authenticated
  using (
    assigned_team_id is not null
    and assigned_team_id in (select team_id from public.users where id = (select auth.uid()))
  )
  with check (
    assigned_team_id in (select team_id from public.users where id = (select auth.uid()))
    and status in ('verified', 'resolved')
  );

-- Grant update permissions for new report columns
grant update (status, assigned_staff_id, assigned_team_id, resolved_by_staff_id, photos, staff_remarks, restoration_eta, resolved_at, updated_at) on public.reports to authenticated;

-- Helper RPC for dispatching a report to a team (security definer)
create or replace function public.dispatch_report_to_team(
  p_reference text,
  p_team_id uuid,
  p_staff_id uuid default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if not (select public.is_admin()) then
    raise exception 'Only administrators can dispatch reports to teams.';
  end if;

  update public.reports
  set
    status = 'verified',
    assigned_team_id = p_team_id,
    assigned_staff_id = coalesce(p_staff_id, assigned_staff_id),
    updated_at = now()
  where id::text = p_reference or reference = p_reference
  returning * into v_report;

  if not found then
    raise exception 'Report not found.';
  end if;

  return v_report;
end;
$$;

grant execute on function public.dispatch_report_to_team(text, uuid, uuid) to authenticated;

-- 6. Storage Policy Update: Team members can view evidence for reports assigned to their team
drop policy if exists "Staff can read team report evidence" on storage.objects;
create policy "Staff can read team report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and exists (
      select 1 from public.reports r
      where (
        r.assigned_staff_id = (select auth.uid())
        or r.assigned_team_id in (select team_id from public.users where id = (select auth.uid()))
      )
      and exists (
        select 1 from jsonb_array_elements(r.photos) as p
        where p->>'path' = storage.objects.name
      )
    )
  );

-- 7. Add audit log trigger for teams
drop trigger if exists teams_audit_log on public.teams;
create trigger teams_audit_log after insert or update or delete on public.teams
  for each row execute function public.audit_log_trigger();

-- 8. Enable Supabase Realtime for live admin map tracking ("Aha na sila")
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
    ) then
      alter publication supabase_realtime add table public.teams;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
    ) then
      alter publication supabase_realtime add table public.reports;
    end if;
  end if;
end
$$;
