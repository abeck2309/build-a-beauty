create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'classic',
  position text not null,
  overall integer not null check (overall between 1 and 99),
  archetype text not null,
  career_team text not null,
  record text,
  result text not null,
  build_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.runs enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
drop policy if exists "Users can create their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users can read their runs" on public.runs;
drop policy if exists "Users can add their runs" on public.runs;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can read their runs" on public.runs for select using (auth.uid() = user_id);
create policy "Users can add their runs" on public.runs for insert with check (auth.uid() = user_id);

create index if not exists idx_runs_user_created_at on public.runs (user_id, created_at desc);
