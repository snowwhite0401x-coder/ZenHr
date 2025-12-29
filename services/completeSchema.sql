-- Complete Supabase SQL schema for ZenHR Leave Manager
-- Run this in the Supabase SQL editor to set up all required tables

-- 1) Enum types -----------------------------------------------------------

create type if not exists public.user_role as enum ('EMPLOYEE', 'HR_ADMIN');

create type if not exists public.leave_type as enum (
  'Annual Leave',
  'Sick Leave',
  'Personal Leave',
  'Public Holiday',
  'Note / Activity Notification'
);

create type if not exists public.leave_status as enum ('Pending', 'Approved', 'Rejected');

-- 2) Core tables ----------------------------------------------------------

-- Departments table
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Users table
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

-- Holidays table
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null
);

-- Leave requests table
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

-- Role permissions table
create table if not exists public.role_permissions (
  role user_role not null,
  feature text not null,
  allowed boolean not null default false,
  primary key (role, feature)
);

-- Leave settings table (for global quotas)
create table if not exists public.leave_settings (
  id uuid primary key default gen_random_uuid(),
  annual_leave_limit integer not null default 2,
  public_holiday_count integer not null default 13,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Office holidays table (for weekly holidays)
create table if not exists public.office_holidays (
  id uuid primary key default gen_random_uuid(),
  sunday boolean not null default false,
  monday boolean not null default false,
  tuesday boolean not null default false,
  wednesday boolean not null default false,
  thursday boolean not null default false,
  friday boolean not null default false,
  saturday boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Basic RLS setup (optional but recommended) --------------------------

alter table public.users enable row level security;
alter table public.leave_requests enable row level security;
alter table public.holidays enable row level security;
alter table public.role_permissions enable row level security;
alter table public.departments enable row level security;
alter table public.leave_settings enable row level security;
alter table public.office_holidays enable row level security;

-- Simple policy examples (adjust for real auth later)
do $$
begin
  -- Users policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'users' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.users
      for all using (true) with check (true);
  end if;

  -- Leave requests policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'leave_requests' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.leave_requests
      for all using (true) with check (true);
  end if;

  -- Departments policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'departments' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.departments
      for all using (true) with check (true);
  end if;

  -- Role permissions policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'role_permissions' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.role_permissions
      for all using (true) with check (true);
  end if;

  -- Leave settings policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'leave_settings' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.leave_settings
      for all using (true) with check (true);
  end if;

  -- Office holidays policy
  if not exists (
    select 1 from pg_policies
    where tablename = 'office_holidays' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.office_holidays
      for all using (true) with check (true);
  end if;
end$$;

-- 4) Seed data: departments, admin user, permissions ---------------------

-- Insert default departments
insert into public.departments (name)
values ('IT'), ('AI'), ('Ops')
on conflict (name) do nothing;

-- Insert admin user
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

-- Insert default permissions
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

-- Insert default leave settings (if not exists)
insert into public.leave_settings (annual_leave_limit, public_holiday_count)
values (2, 13)
on conflict do nothing;

-- If no leave_settings row exists, create one
do $$
begin
  if not exists (select 1 from public.leave_settings) then
    insert into public.leave_settings (annual_leave_limit, public_holiday_count)
    values (2, 13);
  end if;
end$$;

-- Insert default office holidays (Sunday is holiday by default)
insert into public.office_holidays (sunday, monday, tuesday, wednesday, thursday, friday, saturday)
values (true, false, false, false, false, false, false)
on conflict do nothing;

-- If no office_holidays row exists, create one
do $$
begin
  if not exists (select 1 from public.office_holidays) then
    insert into public.office_holidays (sunday, monday, tuesday, wednesday, thursday, friday, saturday)
    values (true, false, false, false, false, false, false);
  end if;
end$$;

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

