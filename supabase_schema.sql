-- Create members table
create table if not exists public.members (
    id text not null,
    name text not null,
    roles text[] not null,
    email text null,
    phone text null,
    avatar text null,
    constraint members_pkey primary key (id)
);

-- Create songs table
create table if not exists public.songs (
    id text not null,
    title text not null,
    artist text null,
    key text null,
    category text null,
    is_new boolean null default false,
    youtube_url text null,
    lyrics text null,
    chords text null,
    bpm int null,
    constraint songs_pkey primary key (id),
    constraint songs_title_artist_key unique (title, artist)
);

-- Create monthly_schedules table
create table if not exists public.monthly_schedules (
    id text not null,
    date date not null,
    assignments jsonb null,
    playlist_manha _text null,
    playlist_noite _text null,
    is_featured boolean null,
    name_manha text null,
    name_noite text null,
    constraint monthly_schedules_pkey primary key (id)
);


-- Create avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies for avatars bucket

-- Allow public read access to everyone
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access" on storage.objects
  for select using (bucket_id = 'avatars');

-- Allow authenticated users to upload files
drop policy if exists "Authenticated user can upload" on storage.objects;
create policy "Authenticated user can upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Allow owner to update their own files
drop policy if exists "Owner can update" on storage.objects;
create policy "Owner can update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = owner::text)
  with check (auth.uid()::text = owner::text);

-- Allow owner to delete their own files
drop policy if exists "Owner can delete" on storage.objects;
create policy "Owner can delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = owner::text);
