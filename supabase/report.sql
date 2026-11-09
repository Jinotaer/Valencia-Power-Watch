-- Valencia PowerWatch — Reports table (public.reports, public.public_outage_map, report-evidence bucket)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. Reports submitted by residents
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_staff_id uuid references auth.users(id) on delete set null,
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
  is_duplicate boolean not null default false,
  staff_remarks text,
  restoration_eta text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrations for databases created before all columns were present
alter table public.reports add column if not exists pinned_location text;
alter table public.reports add column if not exists assigned_staff_id uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists priority text not null default 'medium';
alter table public.reports add column if not exists is_duplicate boolean not null default false;
alter table public.reports add column if not exists staff_remarks text;
alter table public.reports add column if not exists restoration_eta text;
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists updated_at timestamptz not null default now();

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);
create index if not exists reports_created_idx on public.reports (created_at desc);
create index if not exists reports_assigned_staff_idx on public.reports (assigned_staff_id);
create index if not exists reports_duplicate_idx on public.reports (is_duplicate);

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

alter table public.reports drop constraint if exists reports_priority_check;
alter table public.reports add constraint reports_priority_check
  check (priority in ('low', 'medium', 'high'));

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('pending', 'verified', 'resolved', 'rejected'));

-- 2. Sequential public reference: PW-YYYY-#### and updated_at / resolved_at trigger
create sequence if not exists public.report_reference_seq;

create or replace function public.assign_report_reference()
returns trigger
language plpgsql
as $$
begin
  new.reference := 'PW-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.report_reference_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists reports_assign_reference on public.reports;
create trigger reports_assign_reference
  before insert on public.reports
  for each row
  when (new.reference is null)
  execute function public.assign_report_reference();

create or replace function public.touch_report_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'resolved' and (old.status is distinct from 'resolved') then
    new.resolved_at = coalesce(new.resolved_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
  before update on public.reports
  for each row
  execute function public.touch_report_updated_at();

-- 3. Privacy-safe public outage map view
create or replace view public.public_outage_map as
select
  id,
  reference,
  barangay,
  outage_type,
  status,
  created_at,
  updated_at,
  latitude,
  longitude
from public.reports
where status <> 'rejected';

grant select on public.public_outage_map to anon, authenticated;

-- 4. Report RLS & duplicate flagging
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

alter table public.reports enable row level security;

drop policy if exists "Residents can read own reports" on public.reports;
create policy "Residents can read own reports"
  on public.reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Residents can create own reports" on public.reports;
create policy "Residents can create own reports"
  on public.reports
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

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

revoke update on public.reports from authenticated;
grant update (status, assigned_staff_id, photos, staff_remarks, restoration_eta, resolved_at) on public.reports to authenticated;

create or replace function public.set_report_duplicate_flag(p_report_id text, p_flagged boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only administrators can flag duplicate reports.';
  end if;

  update public.reports set is_duplicate = p_flagged where id::text = p_report_id or reference = p_report_id;
  if not found then
    raise exception 'Report not found.';
  end if;
end;
$$;

drop function if exists public.set_report_duplicate_flag(uuid, boolean);
revoke execute on function public.set_report_duplicate_flag(text, boolean) from anon;
grant execute on function public.set_report_duplicate_flag(text, boolean) to authenticated;

-- 5. Private evidence bucket (report-evidence)
insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

drop policy if exists "Residents can read own report evidence" on storage.objects;
create policy "Residents can read own report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Residents can upload own report evidence" on storage.objects;
create policy "Residents can upload own report evidence"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Residents can delete own report evidence" on storage.objects;
create policy "Residents can delete own report evidence"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Admins can read report evidence" on storage.objects;
create policy "Admins can read report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and (select public.is_admin())
  );

drop policy if exists "Staff can read assigned report evidence" on storage.objects;
create policy "Staff can read assigned report evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-evidence'
    and exists (
      select 1 from public.reports r
      where r.assigned_staff_id = (select auth.uid())
        and exists (
          select 1 from jsonb_array_elements(r.photos) as p
          where p->>'path' = storage.objects.name
        )
    )
  );
