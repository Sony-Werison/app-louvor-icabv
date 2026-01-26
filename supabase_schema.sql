-- supabase_schema.sql

-- 1. Create table for Members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles text[] not null,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- 2. Create table for Songs
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  key text,
  category text check (category in ('Louvor', 'Hino', 'Infantil')),
  "isNew" boolean default false,
  "youtubeUrl" text,
  lyrics text,
  chords text,
  bpm integer,
  created_at timestamptz default now()
);

-- 3. Create table for Monthly Schedules
create table if not exists monthly_schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  assignments jsonb,
  playlist_manha uuid[],
  playlist_noite uuid[],
  "isFeatured" boolean default false,
  name_manha text,
  name_noite text,
  created_at timestamptz default now()
);


-- 4. Enable Row Level Security (RLS)
-- Important: This secures your data so that only logged-in users can access it.
alter table members enable row level security;
alter table songs enable row level security;
alter table monthly_schedules enable row level security;


-- 5. Create RLS policies
-- These policies allow any authenticated user to perform all actions (select, insert, update, delete).
-- You can customize these policies to be more restrictive based on your app's needs.

-- Policies for members table
drop policy if exists "Allow all access for authenticated users" on members;
create policy "Allow all access for authenticated users" on members
  for all
  to authenticated
  using (true)
  with check (true);

-- Policies for songs table
drop policy if exists "Allow all access for authenticated users" on songs;
create policy "Allow all access for authenticated users" on songs
  for all
  to authenticated
  using (true)
  with check (true);

-- Policies for monthly_schedules table
drop policy if exists "Allow all access for authenticated users" on monthly_schedules;
create policy "Allow all access for authenticated users" on monthly_schedules
  for all
  to authenticated
  using (true)
  with check (true);
