-- Drop policies to ensure idempotency
drop policy if exists "Public members are viewable by everyone." on public.members;
drop policy if exists "Users can insert their own member." on public.members;
drop policy if exists "Users can update their own member." on public.members;
drop policy if exists "Users can delete their own member." on public.members;

drop policy if exists "Public songs are viewable by everyone." on public.songs;
drop policy if exists "Authenticated users can insert songs." on public.songs;
drop policy if exists "Authenticated users can update songs." on public.songs;
drop policy if exists "Authenticated users can delete songs." on public.songs;

drop policy if exists "Public schedules are viewable by everyone." on public.monthly_schedules;
drop policy if exists "Authenticated users can insert schedules." on public.monthly_schedules;
drop policy if exists "Authenticated users can update schedules." on public.monthly_schedules;
drop policy if exists "Authenticated users can delete schedules." on public.monthly_schedules;

drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update an avatar." on storage.objects;
drop policy if exists "Anyone can read an avatar." on storage.objects;
drop policy if exists "Authenticated users can delete their own avatar." on storage.objects;


-- Create tables
create table if not exists public.members (
    id text primary key,
    name text not null,
    email text,
    phone text,
    roles text[] not null,
    avatar text
);

create table if not exists public.songs (
    id text primary key,
    title text not null,
    artist text,
    key text,
    category text,
    "isNew" boolean default false,
    "youtubeUrl" text,
    lyrics text,
    chords text,
    "timesPlayedQuarterly" integer default 0,
    "timesPlayedTotal" integer default 0,
    bpm integer,
    unique(title, artist)
);

create table if not exists public.monthly_schedules (
    id text primary key,
    date timestamptz not null,
    assignments jsonb not null default '{}'::jsonb,
    playlist_manha text[],
    playlist_noite text[],
    isFeatured boolean default false,
    name_manha text,
    name_noite text,
    unique(date)
);

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;


-- Set up Row Level Security (RLS)
alter table public.members enable row level security;
alter table public.songs enable row level security;
alter table public.monthly_schedules enable row level security;

-- Policies for members
create policy "Public members are viewable by everyone." on public.members
  for select using (true);
create policy "Users can insert their own member." on public.members
  for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own member." on public.members
  for update using (auth.role() = 'authenticated');
create policy "Users can delete their own member." on public.members
  for delete using (auth.role() = 'authenticated');

-- Policies for songs
create policy "Public songs are viewable by everyone." on public.songs
  for select using (true);
create policy "Authenticated users can insert songs." on public.songs
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update songs." on public.songs
  for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete songs." on public.songs
  for delete using (auth.role() = 'authenticated');

-- Policies for monthly_schedules
create policy "Public schedules are viewable by everyone." on public.monthly_schedules
  for select using (true);
create policy "Authenticated users can insert schedules." on public.monthly_schedules
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update schedules." on public.monthly_schedules
  for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete schedules." on public.monthly_schedules
  for delete using (auth.role() = 'authenticated');

-- Policies for storage
create policy "Anyone can upload an avatar." on storage.objects for
    insert to authenticated with check (bucket_id = 'avatars');

create policy "Anyone can update an avatar." on storage.objects for
    update to authenticated with check (bucket_id = 'avatars');

create policy "Anyone can read an avatar." on storage.objects for
    select with check (bucket_id = 'avatars');
    
create policy "Authenticated users can delete their own avatar." on storage.objects
    for delete to authenticated using (
        bucket_id = 'avatars' and owner::text = auth.uid()::text
    );