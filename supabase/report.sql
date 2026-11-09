-- Valencia PowerWatch — Report module
-- Run in the Supabase SQL Editor after user.sql

-- 1. Reports submitted by residents
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  outage_type text not null
    check (outage_type in (
      'line-fault',
      'transformer-issue',
      'weather-disturbance',
      'power-supply-interruption',
      'equipment-related',
      'scheduled-maintenance',
      'unknown',
      'other'
    )),
  started_time text not null,
  notes text,
  barangay text not null,
  landmark text,
  pinned_location text,
  pin_x double precision not null,
  pin_y double precision not null,
  pin_source text not null default 'manual'
    check (pin_source in ('gps', 'manual')),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  photos jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'resolved', 'rejected')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

-- Admin map and report queue list every report newest-first.
create index if not exists reports_created_idx
  on public.reports (created_at desc);

-- Migrations for databases created before the current type list / pinned location
alter table public.reports add column if not exists pinned_location text;
alter table public.reports add column if not exists assigned_staff_id uuid references auth.users(id) on delete set null;

-- Index the FK (Postgres does not index it automatically); also speeds up the
-- auth.users ON DELETE SET NULL cascade.
create index if not exists reports_assigned_staff_idx
  on public.reports (assigned_staff_id);

alter table public.reports drop constraint if exists reports_outage_type_check;

update public.reports set outage_type = 'power-supply-interruption' where outage_type = 'no-power';
update public.reports set outage_type = 'equipment-related' where outage_type = 'flickering';
update public.reports set outage_type = 'line-fault' where outage_type = 'damaged-line';

alter table public.reports add constraint reports_outage_type_check
  check (outage_type in (
    'line-fault',
    'transformer-issue',
    'weather-disturbance',
    'power-supply-interruption',
    'equipment-related',
    'scheduled-maintenance',
    'unknown',
    'other'
  ));

-- Priority chosen by the resident in the submit form
alter table public.reports add column if not exists priority text not null default 'medium';
alter table public.reports drop constraint if exists reports_priority_check;
alter table public.reports add constraint reports_priority_check
  check (priority in ('low', 'medium', 'high'));

-- Rejected is a terminal admin state
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('pending', 'verified', 'resolved', 'rejected'));

-- Admins reject invalid reports; staff never set this status.
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('pending', 'verified', 'resolved', 'rejected'));

-- Sequential public reference: PW-YYYY-####
create sequence if not exists public.report_reference_seq;

create or replace function public.assign_report_reference()
returns trigger as $$
begin
  new.reference := 'PW-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.report_reference_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists reports_assign_reference on public.reports;
create trigger reports_assign_reference
  before insert on public.reports
  for each row
  when (new.reference is null)
  execute function public.assign_report_reference();

-- 2. Report RLS: residents only see and create their own reports
alter table public.reports enable row level security;

drop policy if exists "Residents can read own reports" on public.reports;
drop policy if exists "Residents can create own reports" on public.reports;

create policy "Residents can read own reports"
  on public.reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Residents can create own reports"
  on public.reports
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Admins can review every resident report and assign a field staff member
-- (defined here too so this file can be run on its own)
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

drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports"
  on public.reports
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports
  for update
  to authenticated
  using ((select public.is_admin()));

-- Field staff read and progress the reports assigned to them. Their own
-- update must keep the job assigned to them (with check).
drop policy if exists "Staff can view assigned reports" on public.reports;
create policy "Staff can view assigned reports"
  on public.reports
  for select
  to authenticated
  using (assigned_staff_id = (select auth.uid()));

drop policy if exists "Staff can update assigned reports" on public.reports;
create policy "Staff can update assigned reports"
  on public.reports
  for update
  to authenticated
  using (assigned_staff_id = (select auth.uid()))
  with check (
    assigned_staff_id = (select auth.uid())
    and status in ('verified', 'resolved')
  );

-- PostgREST needs column-level privileges: staff move status and append
-- resolution evidence to photos; admins also reassign; reassignment on a
-- staff row is still blocked by RLS with check.
revoke update on public.reports from authenticated;
grant update (status, assigned_staff_id, photos) on public.reports to authenticated;

-- 3. Private evidence bucket, one folder per user
insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

drop policy if exists "Residents can read own report evidence" on storage.objects;
drop policy if exists "Residents can upload own report evidence" on storage.objects;
drop policy if exists "Residents can delete own report evidence" on storage.objects;

create policy "Residents can read own report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Residents can upload own report evidence"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Residents can delete own report evidence"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Admins must create signed URLs to review resident evidence
drop policy if exists "Admins can read report evidence" on storage.objects;

create policy "Admins can read report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (select public.is_admin())
  );
