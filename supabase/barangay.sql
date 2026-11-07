-- Valencia PowerWatch — Barangay module
-- Run in the Supabase SQL Editor after user.sql

-- 1. Barangay liaison directory
-- (zone, power status, response crew and restoration ETA removed from the app;
--  the alters below drop them from databases created with earlier versions)
create table if not exists public.barangays (
  code text primary key,
  name text not null unique,
  affected_households integer not null default 0 check (affected_households >= 0),
  total_households integer not null default 0 check (total_households >= 0),
  captain text not null default 'Barangay Council',
  contact_number text not null default '+63 917 000 0000',
  pinned_location text,
  pin_x double precision not null default 50,
  pin_y double precision not null default 50,
  pin_source text not null default 'manual'
    check (pin_source in ('gps', 'manual')),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  updated_at timestamptz not null default now()
);

-- Migration for databases created before these columns were removed from the app
alter table public.barangays drop column if exists zone;
alter table public.barangays drop column if exists status;
alter table public.barangays drop column if exists assigned_crew;
alter table public.barangays drop column if exists restoration_eta;

-- Same location fields as public.reports. pin_x/pin_y keep the legacy
-- 50/50 values; latitude/longitude are the real pin.
alter table public.barangays add column if not exists pinned_location text;
alter table public.barangays add column if not exists pin_x double precision not null default 50;
alter table public.barangays add column if not exists pin_y double precision not null default 50;
alter table public.barangays add column if not exists pin_source text not null default 'manual'
  check (pin_source in ('gps', 'manual'));
alter table public.barangays add column if not exists latitude double precision;
alter table public.barangays add column if not exists longitude double precision;
alter table public.barangays add column if not exists accuracy double precision;

-- 2. Codes are generated for barangays added from the admin page (VAL-001, VAL-002, ...)
create sequence if not exists public.barangay_code_seq;

create or replace function public.prepare_barangay()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'VAL-' || lpad(nextval('public.barangay_code_seq')::text, 3, '0');
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists barangays_prepare on public.barangays;
create trigger barangays_prepare
  before insert or update on public.barangays
  for each row execute function public.prepare_barangay();

-- 3. Row Level Security: anyone signed in can read, only admins can change
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
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.barangays enable row level security;

drop policy if exists "Authenticated users can read barangays" on public.barangays;
create policy "Authenticated users can read barangays"
  on public.barangays
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can insert barangays" on public.barangays;
create policy "Admins can insert barangays"
  on public.barangays
  for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update barangays" on public.barangays;
create policy "Admins can update barangays"
  on public.barangays
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete barangays" on public.barangays;
create policy "Admins can delete barangays"
  on public.barangays
  for delete
  to authenticated
  using ((select public.is_admin()));

-- 4. Seed the 31 barangays used by the resident and staff portals
insert into public.barangays
  (code, name, affected_households, total_households, captain, contact_number)
values
  ('VAL-001', 'Bagontapay', 1250, 3100, 'Hon. Manuel Tan', '+63 917 234 5678'),
  ('VAL-002', 'Bantuanon', 0, 1500, 'Hon. Sergio Cruz', '+63 917 777 8899'),
  ('VAL-003', 'Barobo', 0, 1400, 'Hon. Patricia Ramos', '+63 917 888 9900'),
  ('VAL-004', 'Batangan', 0, 2850, 'Hon. Roberto Chavez', '+63 917 345 6789'),
  ('VAL-005', 'Catumbalon', 0, 2100, 'Hon. Maria Liza Roxas', '+63 917 456 7890'),
  ('VAL-006', 'Colonia', 620, 1950, 'Hon. Danilo Santos', '+63 917 567 8901'),
  ('VAL-007', 'Concepcion', 0, 1800, 'Hon. Antonio Flores', '+63 917 678 9012'),
  ('VAL-008', 'Dagat-Kidavao', 0, 1650, 'Hon. Josefina Lim', '+63 917 789 0123'),
  ('VAL-009', 'Dampas', 0, 2000, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-010', 'Datu Salumay', 0, 1200, 'Hon. Mario Alcantara', '+63 917 999 0011'),
  ('VAL-011', 'Guinoyuran', 1400, 2900, 'Hon. Ricardo Mercado', '+63 917 890 1234'),
  ('VAL-012', 'Kahaponan', 0, 2400, 'Hon. Lucita Gonzales', '+63 917 000 1122'),
  ('VAL-013', 'Laligan', 0, 2200, 'Hon. Grace Villanueva', '+63 917 901 2345'),
  ('VAL-014', 'Lilingayon', 0, 2450, 'Hon. Fernando Ocampo', '+63 917 012 3456'),
  ('VAL-015', 'Lourdes', 980, 3600, 'Hon. Alicia Soriano', '+63 917 111 2233'),
  ('VAL-016', 'Lumbayao', 0, 3100, 'Hon. Vicente Navarro', '+63 917 222 3344'),
  ('VAL-017', 'Lumbo', 0, 2200, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-018', 'Lurugan', 0, 2000, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-019', 'Mabuhay', 0, 1800, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-020', 'Mailag', 0, 2750, 'Hon. Ramon Bautista', '+63 917 333 4455'),
  ('VAL-021', 'Mt. Nebo', 0, 1600, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-022', 'Musuan', 0, 2100, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-023', 'Pinatilan', 0, 1900, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-024', 'Poblacion', 0, 8420, 'Hon. Eduardo Galacio', '+63 917 123 4567'),
  ('VAL-025', 'San Carlos', 0, 2300, 'Hon. Teresa Domingo', '+63 917 444 5566'),
  ('VAL-026', 'San Isidro', 0, 1700, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-027', 'Sinayawan', 0, 2500, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-028', 'Sugod', 0, 3200, 'Hon. Gabriel Castro', '+63 917 555 6677'),
  ('VAL-029', 'Tongantongan', 0, 2950, 'Hon. Carmelita Perez', '+63 917 666 7788'),
  ('VAL-030', 'Tugaya', 0, 1850, 'Barangay Council', '+63 917 000 0000'),
  ('VAL-031', 'Vintar', 0, 1500, 'Barangay Council', '+63 917 000 0000')
on conflict do nothing;

-- Keep generated codes ahead of every seeded and admin-created VAL-### code.
-- (Not row count: deleting a barangay would otherwise let the sequence emit an
--  already-taken code and the next admin create would fail on the primary key.
--  With no codes yet the sequence is left alone so the first one gets VAL-001.)
do $$
declare
  top_code int;
begin
  select coalesce(max(substring(code from 5)::int), 0) into top_code
  from public.barangays
  where code ~ '^VAL-[0-9]{3}$';

  if top_code > 0 then
    perform setval('public.barangay_code_seq', top_code);
  end if;
end $$;
