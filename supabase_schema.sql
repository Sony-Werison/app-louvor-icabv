-- Create members table
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles text[] not null,
  email text,
  phone text,
  avatar text
);

-- Create songs table
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  key text,
  category text not null,
  is_new boolean default false,
  youtube_url text,
  lyrics text,
  chords text,
  bpm integer,
  unique(title, artist)
);

-- Create monthly_schedules table
create table monthly_schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  assignments jsonb not null default '{}'::jsonb,
  playlist_manha text[],
  playlist_noite text[],
  name_manha text,
  name_noite text,
  "isFeatured" boolean default false
);


-- Enable Row Level Security
alter table members enable row level security;
alter table songs enable row level security;
alter table monthly_schedules enable row level security;

-- Policies for members
create policy "Allow all access to authenticated users" on members for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Policies for songs
create policy "Allow all access to authenticated users" on songs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Policies for monthly_schedules
create policy "Allow all access to authenticated users" on monthly_schedules for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Policies for storage
create policy "Allow public read access to avatars" on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Allow authenticated users to upload avatars" on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Allow authenticated users to update their own avatars" on storage.objects for update
  using ( auth.uid()::text = owner::text and bucket_id = 'avatars' );
  
create policy "Allow authenticated users to delete their own avatars" on storage.objects for delete
  using ( auth.uid()::text = owner::text and bucket_id = 'avatars' );
