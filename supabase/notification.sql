-- Valencia PowerWatch — Notifications table (public.notifications)
-- Run in the Supabase SQL Editor after supabase/user.sql and supabase/report.sql

-- 1. Notifications: in-app updates for residents, field staff, and admin broadcasts
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('report_status', 'announcement', 'schedule', 'manual', 'assignment')),
  title text not null,
  body text,
  report_reference text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('report_status', 'announcement', 'schedule', 'manual', 'assignment'));

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

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

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage notifications" on public.notifications;
create policy "Admins can manage notifications"
  on public.notifications
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert, update, delete on public.notifications to authenticated;

-- 3. Automatic Triggers on public.reports
-- 3a. Notify resident when report status changes
create or replace function public.notify_report_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (user_id, type, title, body, report_reference)
    values (
      new.user_id,
      'report_status',
      case new.status
        when 'verified' then 'Your report was verified'
        when 'resolved' then 'Your report was resolved'
        when 'rejected' then 'Your report was reviewed'
        else 'Report status updated'
      end,
      new.reference || ' is now ' || new.status,
      new.reference
    );
  end if;
  return new;
end;
$$;

drop trigger if exists reports_notify_status on public.reports;
create trigger reports_notify_status
  after update of status on public.reports
  for each row
  execute function public.notify_report_status();

-- 3b. Notify field staff when a report is assigned to them
create or replace function public.notify_staff_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_staff_id is not null and (old.assigned_staff_id is distinct from new.assigned_staff_id) then
    insert into public.notifications (user_id, type, title, body, report_reference)
    values (
      new.assigned_staff_id,
      'assignment',
      'New job assigned: ' || new.reference,
      'Brgy. ' || new.barangay || ' — ' || new.outage_type || ' (' || coalesce(new.priority, 'medium') || ' priority)',
      new.reference
    );
  end if;
  return new;
end;
$$;

drop trigger if exists reports_notify_staff_assignment on public.reports;
create trigger reports_notify_staff_assignment
  after update of assigned_staff_id on public.reports
  for each row
  execute function public.notify_staff_assignment();

-- 3c. Notify resident when an admin marks their report as a duplicate
create or replace function public.notify_report_duplicate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.is_duplicate, false) = false and new.is_duplicate = true then
    insert into public.notifications (user_id, type, title, body, report_reference)
    values (
      new.user_id,
      'report_status',
      'Your report was marked as duplicate',
      new.reference || ' was linked to an existing incident in the same area.',
      new.reference
    );
  end if;
  return new;
end;
$$;

drop trigger if exists reports_notify_duplicate on public.reports;
create trigger reports_notify_duplicate
  after update of is_duplicate on public.reports
  for each row
  execute function public.notify_report_duplicate();
