-- Office Holidays table for storing which days of the week are holidays
-- This is a singleton table (only one row)

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

-- Enable RLS
alter table public.office_holidays enable row level security;

-- Policy: Allow all access for anon dev
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

-- Insert default row (Sunday is holiday by default)
insert into public.office_holidays (sunday, monday, tuesday, wednesday, thursday, friday, saturday)
values (true, false, false, false, false, false, false)
on conflict do nothing;

-- If no row exists, create one
do $$
begin
  if not exists (select 1 from public.office_holidays) then
    insert into public.office_holidays (sunday, monday, tuesday, wednesday, thursday, friday, saturday)
    values (true, false, false, false, false, false, false);
  end if;
end$$;

