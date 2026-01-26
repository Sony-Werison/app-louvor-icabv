-- Drop existing tables (optional, for clean setup)
-- drop table if exists public.monthly_schedules;
-- drop table if exists public.songs;
-- drop table if exists public.members;

-- Create members table
create table public.members (
  id uuid not null default gen_random_uuid(),
  name text not null,
  roles text[] not null,
  email text,
  phone text,
  avatar_url text,
  primary key (id)
);

-- Create songs table
create table public.songs (
  id uuid not null default gen_random_uuid(),
  title text not null,
  artist text,
  key text,
  category text,
  is_new boolean default false,
  youtube_url text,
  lyrics text,
  chords text,
  primary key (id),
  unique(title, artist)
);

-- Create monthly_schedules table
create table public.monthly_schedules (
  id uuid not null default gen_random_uuid(),
  date timestamp with time zone not null,
  assignments jsonb,
  playlist_manha text[],
  playlist_noite text[],
  is_featured boolean default false,
  name_manha text,
  name_noite text,
  primary key (id),
  unique(date)
);

-- RLS policies for members
alter table public.members enable row level security;

create policy "Enable read access for all users" on "public"."members"
as permissive for select
to public
using (true);

create policy "Enable insert for authenticated users" on "public"."members"
as permissive for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users" on "public"."members"
as permissive for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users" on "public"."members"
as permissive for delete
to authenticated
using (true);


-- RLS policies for songs
alter table public.songs enable row level security;

create policy "Enable read access for all users" on "public"."songs"
as permissive for select
to public
using (true);

create policy "Enable insert for authenticated users" on "public"."songs"
as permissive for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users" on "public"."songs"
as permissive for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users" on "public"."songs"
as permissive for delete
to authenticated
using (true);


-- RLS policies for monthly_schedules
alter table public.monthly_schedules enable row level security;

create policy "Enable read access for all users" on "public"."monthly_schedules"
as permissive for select
to public
using (true);

create policy "Enable insert for authenticated users" on "public"."monthly_schedules"
as permissive for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users" on "public"."monthly_schedules"
as permissive for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users" on "public"."monthly_schedules"
as permissive for delete
to authenticated
using (true);


-- Storage policies
-- Create a bucket for avatars (this must be done in the Supabase UI)
-- and apply these policies in the Supabase SQL Editor.

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid()::text = owner::text )
  with check ( bucket_id = 'avatars' );

create policy "Allow authenticated users to delete their own avatar"
  on storage.objects for delete
  using ( auth.uid()::text = owner::text and bucket_id = 'avatars' );
