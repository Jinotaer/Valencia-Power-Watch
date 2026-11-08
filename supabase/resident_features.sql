-- Valencia PowerWatch — Resident features (modules 4-8)
-- Run in the Supabase SQL Editor AFTER user.sql, report.sql, barangay.sql
-- and schedule.sql. Everything here is idempotent, so re-running is safe.

-- 1. Restoration updates need an updated_at stamp on reports
alter table public.reports add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_report_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
  before update on public.reports
  for each row
  execute function public.touch_report_updated_at();

-- 2. Privacy-safe public outage map: every non-rejected report with only the
-- fields a neighbor needs (no user_id, notes, landmarks or evidence).
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

-- 3. Announcements (official advisories, maintenance and restoration news)
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

-- Seed advisories (guarded so re-runs don't duplicate them)
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

-- 4. Notifications: in-app updates for the report owner, written by trigger
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('report_status', 'announcement', 'schedule')),
  title text not null,
  body text,
  report_reference text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

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

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Written whenever a report's status changes (runs as definer, so admins and
-- staff updating reports need no direct insert rights).
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

-- 5. Feedback (ratings and comments from residents)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_reference text,
  rating integer not null check (rating between 1 and 5),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Users can submit own feedback" on public.feedback;
create policy "Users can submit own feedback"
  on public.feedback
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own feedback" on public.feedback;
create policy "Users can read own feedback"
  on public.feedback
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read feedback" on public.feedback;
create policy "Admins can read feedback"
  on public.feedback
  for select
  to authenticated
  using ((select public.is_admin()));

grant select, insert on public.feedback to authenticated;

-- 6. Persisted notification preferences on the profile row
alter table public.users
  add column if not exists notification_preferences jsonb not null
  default '{"outageAlerts":true,"reportStatusUpdates":true,"scheduledReminders":false}'::jsonb;

grant update (notification_preferences) on public.users to authenticated;
