-- Valencia PowerWatch — Audit Logs table (public.audit_logs)
-- Run in the Supabase SQL Editor after all other table SQL files

-- 1. Audit logs: every insert/update/delete on core tables
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

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

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using ((select public.is_admin()));

grant select on public.audit_logs to authenticated;

-- 3. Automatic Audit Trigger across all application tables
create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_email text;
  v_entity_id text;
  v_metadata jsonb := '{}'::jsonb;
begin
  if TG_OP = 'DELETE' then
    v_entity_id := COALESCE(NULLIF((to_jsonb(OLD)->>'id'), ''), NULLIF((to_jsonb(OLD)->>'code'), ''), NULLIF((to_jsonb(OLD)->>'key'), ''), NULLIF((to_jsonb(OLD)->>'value'), ''));
    v_metadata := jsonb_build_object('old', to_jsonb(OLD));
  elsif TG_OP = 'INSERT' then
    v_entity_id := COALESCE(NULLIF((to_jsonb(NEW)->>'id'), ''), NULLIF((to_jsonb(NEW)->>'code'), ''), NULLIF((to_jsonb(NEW)->>'key'), ''), NULLIF((to_jsonb(NEW)->>'value'), ''));
    v_metadata := jsonb_build_object('new', to_jsonb(NEW));
  else
    v_entity_id := COALESCE(NULLIF((to_jsonb(NEW)->>'id'), ''), NULLIF((to_jsonb(NEW)->>'code'), ''), NULLIF((to_jsonb(NEW)->>'key'), ''), NULLIF((to_jsonb(NEW)->>'value'), ''));
    v_metadata := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  end if;

  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  values (v_actor_id, v_actor_email, lower(TG_OP)::text, TG_TABLE_NAME, v_entity_id, v_metadata);

  return COALESCE(NEW, OLD);
end;
$$;

drop trigger if exists users_audit_log on public.users;
create trigger users_audit_log after insert or update or delete on public.users
  for each row execute function public.audit_log_trigger();

drop trigger if exists reports_audit_log on public.reports;
create trigger reports_audit_log after insert or update or delete on public.reports
  for each row execute function public.audit_log_trigger();

drop trigger if exists barangays_audit_log on public.barangays;
create trigger barangays_audit_log after insert or update or delete on public.barangays
  for each row execute function public.audit_log_trigger();

drop trigger if exists schedules_audit_log on public.schedules;
create trigger schedules_audit_log after insert or update or delete on public.schedules
  for each row execute function public.audit_log_trigger();

drop trigger if exists announcements_audit_log on public.announcements;
create trigger announcements_audit_log after insert or update or delete on public.announcements
  for each row execute function public.audit_log_trigger();

drop trigger if exists feedback_audit_log on public.feedback;
create trigger feedback_audit_log after insert or update or delete on public.feedback
  for each row execute function public.audit_log_trigger();

drop trigger if exists system_settings_audit_log on public.system_settings;
create trigger system_settings_audit_log after insert or update or delete on public.system_settings
  for each row execute function public.audit_log_trigger();

drop trigger if exists role_permissions_audit_log on public.role_permissions;
create trigger role_permissions_audit_log after insert or update or delete on public.role_permissions
  for each row execute function public.audit_log_trigger();

drop trigger if exists report_categories_audit_log on public.report_categories;
create trigger report_categories_audit_log after insert or update or delete on public.report_categories
  for each row execute function public.audit_log_trigger();
