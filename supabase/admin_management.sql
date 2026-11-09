-- Valencia PowerWatch — Admin management (staff lifecycle, barangay/staff
-- coverage, report flags, admin notifications, settings, analytics and audit)
-- Run in the Supabase SQL Editor after user.sql, report.sql, barangay.sql,
-- schedule.sql and resident_features.sql. Idempotent / re-runnable.

-- ===========================================================================
-- 1. Staff account lifecycle: is_active + position
-- ===========================================================================

alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists position text;

create index if not exists users_role_active_idx
  on public.users (role, is_active);

-- Signup trigger: keep staff position from auth metadata; staff have no barangay.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, id_number, email, full_name, role, contact_number, address, position)
  values (
    new.id,
    case
      when new.raw_user_meta_data->>'id_number' is not null
        then new.raw_user_meta_data->>'id_number'
      when new.raw_user_meta_data->>'role' = 'staff'
        then 'STF-' || substr(new.id::text, 1, 4)
      else null
    end,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'staff' then 'staff' else 'resident' end,
    new.raw_user_meta_data->>'contact_number',
    case
      when new.raw_user_meta_data->>'role' = 'staff' then null
      else coalesce(new.raw_user_meta_data->>'barangay', new.raw_user_meta_data->>'address', '')
    end,
    nullif(new.raw_user_meta_data->>'position', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    address = case
      when public.users.role = 'staff' then null
      else coalesce(excluded.address, public.users.address)
    end,
    position = coalesce(excluded.position, public.users.position);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admins may edit every profile field (own policy below still covers self edits).
drop policy if exists "Admins can update user profiles" on public.users;
create policy "Admins can update user profiles"
  on public.users
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update (position) on public.users to authenticated;

-- Admin-only activation toggle: is_active is not a user-self-editable column.
create or replace function public.set_user_active(p_user_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only administrators can change account status.';
  end if;

  update public.users set is_active = p_is_active where id = p_user_id;
  if not found then
    raise exception 'User not found.';
  end if;
end;
$$;

revoke execute on function public.set_user_active(uuid, boolean) from anon;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

-- ===========================================================================
-- 2. Report verification: duplicate flag
-- ===========================================================================

alter table public.reports add column if not exists is_duplicate boolean not null default false;
create index if not exists reports_duplicate_idx on public.reports (is_duplicate);

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

-- ===========================================================================
-- 3. Notifications: admin management (manual messages, all delivery records)
-- ===========================================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('report_status', 'announcement', 'schedule', 'manual'));

drop policy if exists "Admins can manage notifications" on public.notifications;
create policy "Admins can manage notifications"
  on public.notifications
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant insert, update, delete on public.notifications to authenticated;

-- ===========================================================================
-- 4. System settings, role permissions and report categories
-- ===========================================================================

create table if not exists public.system_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'staff', 'resident')),
  permission text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (role, permission)
);

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

create index if not exists report_categories_sort_idx on public.report_categories (sort_order, label);

alter table public.system_settings enable row level security;
alter table public.role_permissions enable row level security;
alter table public.report_categories enable row level security;

drop policy if exists "Anyone can read system settings" on public.system_settings;
create policy "Anyone can read system settings"
  on public.system_settings for select using (true);

drop policy if exists "Admins can manage system settings" on public.system_settings;
create policy "Admins can manage system settings"
  on public.system_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read role permissions" on public.role_permissions;
create policy "Anyone can read role permissions"
  on public.role_permissions for select using (true);

drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions"
  on public.role_permissions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read report categories" on public.report_categories;
create policy "Anyone can read report categories"
  on public.report_categories for select using (true);

drop policy if exists "Admins can manage report categories" on public.report_categories;
create policy "Admins can manage report categories"
  on public.report_categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.system_settings, public.role_permissions, public.report_categories to anon, authenticated;
grant insert, update, delete on public.system_settings, public.role_permissions, public.report_categories to authenticated;

-- Settings seeds
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

-- Role permission seeds
insert into public.role_permissions (role, permission, enabled) values
  ('admin', 'admin_console', true),
  ('admin', 'manage_users', true),
  ('admin', 'manage_barangays', true),
  ('admin', 'manage_reports', true),
  ('admin', 'verify_reports', true),
  ('admin', 'assign_staff', true),
  ('admin', 'manage_schedules', true),
  ('admin', 'manage_announcements', true),
  ('admin', 'manage_notifications', true),
  ('admin', 'manage_settings', true),
  ('staff', 'view_assigned_reports', true),
  ('staff', 'update_assigned_reports', true),
  ('staff', 'view_schedules', true),
  ('staff', 'view_map', true),
  ('resident', 'submit_reports', true),
  ('resident', 'view_own_reports', true),
  ('resident', 'view_public_map', true),
  ('resident', 'view_announcements', true),
  ('resident', 'view_schedules', true),
  ('resident', 'send_feedback', true)
on conflict (role, permission) do nothing;

-- Report categories (the existing outage_type check remains authoritative;
-- admins can rename/hide entries here and the submit form reads this table).
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

-- ===========================================================================
-- 5. Audit logs: every insert/update/delete on core tables
-- ===========================================================================

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

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs for select to authenticated using ((select public.is_admin()));

grant select on public.audit_logs to authenticated;

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

drop trigger if exists reports_audit_log on public.reports;
create trigger reports_audit_log after insert or update or delete on public.reports
  for each row execute function public.audit_log_trigger();

drop trigger if exists schedules_audit_log on public.schedules;
create trigger schedules_audit_log after insert or update or delete on public.schedules
  for each row execute function public.audit_log_trigger();

drop trigger if exists announcements_audit_log on public.announcements;
create trigger announcements_audit_log after insert or update or delete on public.announcements
  for each row execute function public.audit_log_trigger();

drop trigger if exists barangays_audit_log on public.barangays;
create trigger barangays_audit_log after insert or update or delete on public.barangays
  for each row execute function public.audit_log_trigger();

drop trigger if exists users_audit_log on public.users;
create trigger users_audit_log after insert or update or delete on public.users
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
