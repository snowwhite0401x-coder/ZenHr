-- Fix missing tables in Supabase
-- Run this if you get errors about missing tables like "departments", "leave_settings", or "office_holidays"

-- Create departments table if it doesn't exist
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Enable RLS for departments
alter table public.departments enable row level security;

-- Create policy for departments if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'departments' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.departments
      for all using (true) with check (true);
  end if;
end$$;

-- Insert default departments if they don't exist
insert into public.departments (name)
values ('IT'), ('AI'), ('Ops')
on conflict (name) do nothing;

-- Create leave_settings table if it doesn't exist
create table if not exists public.leave_settings (
  id uuid primary key default gen_random_uuid(),
  annual_leave_limit integer not null default 2,
  public_holiday_count integer not null default 13,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for leave_settings
alter table public.leave_settings enable row level security;

-- Create policy for leave_settings if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'leave_settings' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.leave_settings
      for all using (true) with check (true);
  end if;
end$$;

-- Insert default leave_settings if it doesn't exist
do $$
begin
  if not exists (select 1 from public.leave_settings) then
    insert into public.leave_settings (annual_leave_limit, public_holiday_count)
    values (2, 13);
  end if;
end$$;

-- Create office_holidays table if it doesn't exist
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

-- Enable RLS for office_holidays
alter table public.office_holidays enable row level security;

-- Create policy for office_holidays if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'office_holidays' and policyname = 'Allow all access for anon dev'
  ) then
    create policy "Allow all access for anon dev" on public.office_holidays
      for all using (true) with check (true);
  end if;
end$$;

-- Insert default office_holidays if it doesn't exist (Sunday is holiday by default)
do $$
begin
  if not exists (select 1 from public.office_holidays) then
    insert into public.office_holidays (sunday, monday, tuesday, wednesday, thursday, friday, saturday)
    values (true, false, false, false, false, false, false);
  end if;
end$$;

