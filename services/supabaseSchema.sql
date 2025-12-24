-- Supabase SQL schema for ZenHR Leave Manager
-- Run this in the Supabase SQL editor (or psql) on your project.

-- 1) Enum types -----------------------------------------------------------

create type public.user_role as enum ('EMPLOYEE', 'HR_ADMIN');

create type public.leave_type as enum (
  'Annual Leave',
  'Sick Leave',
  'Personal Leave',
  'Public Holiday',
  'Note / Activity Notification'
);

create type public.leave_status as enum ('Pending', 'Approved', 'Rejected');

-- 2) Core tables ----------------------------------------------------------

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  password text,
  name text not null,
  department text not null,
  role user_role not null default 'EMPLOYEE',
  annual_leave_used integer not null default 0,
  public_holiday_used integer not null default 0,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  user_name text not null,
  department text not null,
  type leave_type not null,
  start_date date not null,
  end_date date not null,
  days_count integer not null,
  status leave_status not null default 'Pending',
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role user_role not null,
  feature text not null,
  allowed boolean not null default false,
  primary key (role, feature)
);

-- 3) Basic RLS setup (optional but recommended) --------------------------

alter table public.users enable row level security;
alter table public.leave_requests enable row level security;
alter table public.holidays enable row level security;
alter table public.role_permissions enable row level security;
alter table public.departments enable row level security;

-- Simple policy examples (adjust for real auth later)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'users' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.users
      for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'leave_requests' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.leave_requests
      for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'departments' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.departments
      for all using (true) with check (true);
  end if;
end$$;

-- 4) Seed data: departments, admin user, permissions ---------------------

insert into public.departments (name)
values ('IT'), ('AI'), ('Ops')
on conflict (name) do nothing;

-- WARNING: password is stored in plain text here for demo only.
-- In production you should use Supabase Auth or hash passwords.
insert into public.users (username, password, name, department, role, avatar)
values (
  'admin',
  '123456',
  'Super Admin',
  'Ops',
  'HR_ADMIN',
  'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
)
on conflict (username) do nothing;

insert into public.role_permissions (role, feature, allowed)
values
  ('EMPLOYEE', 'VIEW_DASHBOARD', true),
  ('EMPLOYEE', 'VIEW_CALENDAR', true),
  ('EMPLOYEE', 'REQUEST_LEAVE', true),
  ('EMPLOYEE', 'APPROVE_LEAVE', false),
  ('EMPLOYEE', 'MANAGE_SETTINGS', false),
  ('EMPLOYEE', 'VIEW_REPORTS', false),
  ('HR_ADMIN', 'VIEW_DASHBOARD', true),
  ('HR_ADMIN', 'VIEW_CALENDAR', true),
  ('HR_ADMIN', 'REQUEST_LEAVE', true),
  ('HR_ADMIN', 'APPROVE_LEAVE', true),
  ('HR_ADMIN', 'MANAGE_SETTINGS', true),
  ('HR_ADMIN', 'VIEW_REPORTS', true)
on conflict (role, feature) do nothing;

-- 5) Storage policies for avatars bucket -------------------------------------
-- Note: These policies need to be created in Supabase Dashboard > Storage > Policies
-- Or run these SQL commands in Supabase SQL Editor

-- First, make sure the 'avatars' bucket exists and is public
-- You can create it via Supabase Dashboard > Storage > New Bucket
-- Name: avatars, Public: Yes

-- Drop existing policies if they exist
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Public upload avatars" on storage.objects;
drop policy if exists "Public update avatars" on storage.objects;
drop policy if exists "Public delete avatars" on storage.objects;

-- Allow anyone to read avatars
create policy "Public read avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- Allow anyone to upload avatars (for demo purposes)
create policy "Public upload avatars"
on storage.objects
for insert
to public
with check (bucket_id = 'avatars');

-- Allow anyone to update avatars (for upsert)
create policy "Public update avatars"
on storage.objects
for update
to public
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

-- Allow anyone to delete avatars
create policy "Public delete avatars"
on storage.objects
for delete
to public
using (bucket_id = 'avatars');

