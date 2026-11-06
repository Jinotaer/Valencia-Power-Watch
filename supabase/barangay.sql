-- Valencia PowerWatch — Barangay module
-- Run in the Supabase SQL Editor after user.sql

-- 1. Barangay grid status and liaison directory
create table if not exists public.barangays (
  code text primary key,
  name text not null unique,
  zone text not null default 'Central Urban'
    check (zone in ('Central Urban', 'North District', 'South District', 'East District', 'West District')),
  status text not null default 'Energized'
    check (status in ('Energized', 'Interrupted', 'Partial Outage', 'Maintenance')),
  affected_households integer not null default 0 check (affected_households >= 0),
  total_households integer not null default 0 check (total_households >= 0),
  assigned_crew text not null default 'Standby Unit',
  restoration_eta text not null default 'Normal Grid Service',
  captain text not null default 'Barangay Council',
  contact_number text not null default '+63 917 000 0000',
  updated_at timestamptz not null default now()
);

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
  with check (public.is_admin());

drop policy if exists "Admins can update barangays" on public.barangays;
create policy "Admins can update barangays"
  on public.barangays
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete barangays" on public.barangays;
create policy "Admins can delete barangays"
  on public.barangays
  for delete
  to authenticated
  using (public.is_admin());

-- 4. Seed the 31 barangays used by the resident and staff portals
insert into public.barangays
  (code, name, zone, status, affected_households, total_households, assigned_crew, restoration_eta, captain, contact_number)
values
  ('VAL-001', 'Bagontapay', 'East District', 'Interrupted', 1250, 3100, 'Rapid Response Bravo', 'Today, 4:30 PM', 'Hon. Manuel Tan', '+63 917 234 5678'),
  ('VAL-002', 'Bantuanon', 'South District', 'Energized', 0, 1500, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Sergio Cruz', '+63 917 777 8899'),
  ('VAL-003', 'Barobo', 'West District', 'Energized', 0, 1400, 'Standby Unit 2', 'Normal Grid Service', 'Hon. Patricia Ramos', '+63 917 888 9900'),
  ('VAL-004', 'Batangan', 'South District', 'Energized', 0, 2850, 'Standby Unit 2', 'Normal Grid Service', 'Hon. Roberto Chavez', '+63 917 345 6789'),
  ('VAL-005', 'Catumbalon', 'North District', 'Energized', 0, 2100, 'Standby Unit 3', 'Normal Grid Service', 'Hon. Maria Liza Roxas', '+63 917 456 7890'),
  ('VAL-006', 'Colonia', 'West District', 'Partial Outage', 620, 1950, 'Line Crew Delta', 'Today, 6:00 PM', 'Hon. Danilo Santos', '+63 917 567 8901'),
  ('VAL-007', 'Concepcion', 'East District', 'Energized', 0, 1800, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Antonio Flores', '+63 917 678 9012'),
  ('VAL-008', 'Dagat-Kidavao', 'North District', 'Energized', 0, 1650, 'Standby Unit 3', 'Normal Grid Service', 'Hon. Josefina Lim', '+63 917 789 0123'),
  ('VAL-009', 'Dampas', 'South District', 'Energized', 0, 2000, 'Standby Unit 1', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-010', 'Datu Salumay', 'North District', 'Energized', 0, 1200, 'Standby Unit 3', 'Normal Grid Service', 'Hon. Mario Alcantara', '+63 917 999 0011'),
  ('VAL-011', 'Guinoyuran', 'West District', 'Maintenance', 1400, 2900, 'Substation Maintenance Team', 'Today, 5:00 PM (Scheduled)', 'Hon. Ricardo Mercado', '+63 917 890 1234'),
  ('VAL-012', 'Kahaponan', 'North District', 'Energized', 0, 2400, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Lucita Gonzales', '+63 917 000 1122'),
  ('VAL-013', 'Laligan', 'East District', 'Energized', 0, 2200, 'Standby Unit 2', 'Normal Grid Service', 'Hon. Grace Villanueva', '+63 917 901 2345'),
  ('VAL-014', 'Lilingayon', 'South District', 'Energized', 0, 2450, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Fernando Ocampo', '+63 917 012 3456'),
  ('VAL-015', 'Lourdes', 'Central Urban', 'Interrupted', 980, 3600, 'Emergency Feeder Team Alpha', 'Today, 4:00 PM', 'Hon. Alicia Soriano', '+63 917 111 2233'),
  ('VAL-016', 'Lumbayao', 'East District', 'Energized', 0, 3100, 'Standby Unit 3', 'Normal Grid Service', 'Hon. Vicente Navarro', '+63 917 222 3344'),
  ('VAL-017', 'Lumbo', 'North District', 'Energized', 0, 2200, 'Standby Unit 1', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-018', 'Lurugan', 'West District', 'Energized', 0, 2000, 'Standby Unit 2', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-019', 'Mabuhay', 'East District', 'Energized', 0, 1800, 'Standby Unit 3', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-020', 'Mailag', 'North District', 'Energized', 0, 2750, 'Standby Unit 2', 'Normal Grid Service', 'Hon. Ramon Bautista', '+63 917 333 4455'),
  ('VAL-021', 'Mt. Nebo', 'North District', 'Energized', 0, 1600, 'Standby Unit 1', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-022', 'Musuan', 'South District', 'Energized', 0, 2100, 'Standby Unit 2', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-023', 'Pinatilan', 'West District', 'Energized', 0, 1900, 'Standby Unit 3', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-024', 'Poblacion', 'Central Urban', 'Energized', 0, 8420, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Eduardo Galacio', '+63 917 123 4567'),
  ('VAL-025', 'San Carlos', 'West District', 'Energized', 0, 2300, 'Standby Unit 1', 'Normal Grid Service', 'Hon. Teresa Domingo', '+63 917 444 5566'),
  ('VAL-026', 'San Isidro', 'East District', 'Energized', 0, 1700, 'Standby Unit 2', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-027', 'Sinayawan', 'South District', 'Energized', 0, 2500, 'Standby Unit 3', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-028', 'Sugod', 'Central Urban', 'Energized', 0, 3200, 'Standby Unit 2', 'Normal Grid Service', 'Hon. Gabriel Castro', '+63 917 555 6677'),
  ('VAL-029', 'Tongantongan', 'Central Urban', 'Energized', 0, 2950, 'Standby Unit 3', 'Normal Grid Service', 'Hon. Carmelita Perez', '+63 917 666 7788'),
  ('VAL-030', 'Tugaya', 'West District', 'Energized', 0, 1850, 'Standby Unit 1', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000'),
  ('VAL-031', 'Vintar', 'North District', 'Energized', 0, 1500, 'Standby Unit 2', 'Normal Grid Service', 'Barangay Council', '+63 917 000 0000')
on conflict do nothing;

-- Keep generated codes ahead of the seeded VAL-### codes.
select setval('public.barangay_code_seq', greatest((select count(*) from public.barangays), 1));
