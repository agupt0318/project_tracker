-- Run this in the Supabase SQL editor (Database → SQL Editor → New query)

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  q0 text check (q0 in ('yes', 'no')),
  q1 text check (q1 in ('yes', 'no')),
  q2 text check (q2 in ('yes', 'no')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Row Level Security: open access (personal app, no auth needed)
alter table checkins enable row level security;
alter table experiments enable row level security;

create policy "allow all checkins" on checkins for all using (true) with check (true);
create policy "allow all experiments" on experiments for all using (true) with check (true);

-- Auto-update updated_at on checkins
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger checkins_updated_at
  before update on checkins
  for each row execute function update_updated_at();
