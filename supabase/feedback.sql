-- Valencia PowerWatch — Feedback table (public.feedback)
-- Run in the Supabase SQL Editor after supabase/user.sql

-- 1. Feedback (ratings and comments from residents)
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
