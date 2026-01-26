-- Create members table
create table if not exists
  public.members (
    id text not null,
    name text not null,
    email text null,
    phone text null,
    avatar text null,
    roles text[] null,
    constraint members_pkey primary key (id),
    constraint members_id_key unique (id)
  ) tablespace pg_default;

-- Create songs table
create table if not exists
  public.songs (
    id text not null,
    title text not null,
    artist text null,
    key text null,
    category text null,
    "isNew" boolean null default false,
    lyrics text null,
    chords text null,
    "timesPlayedQuarterly" integer null default 0,
    "timesPlayedTotal" integer null default 0,
    constraint songs_pkey primary key (id),
    constraint songs_id_key unique (id)
  ) tablespace pg_default;

-- Create monthly_schedules table
create table if not exists
  public.monthly_schedules (
    id text not null,
    date timestamp with time zone not null,
    assignments jsonb null,
    playlist_manha text[] null,
    playlist_noite text[] null,
    "isFeatured" boolean null default false,
    name_manha text null,
    name_noite text null,
    constraint monthly_schedules_pkey primary key (id),
    constraint monthly_schedules_id_key unique (id)
  ) tablespace pg_default;


-- Storage Bucket for Avatars
insert into
  storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true)
on conflict(id) do nothing;

-- Policies for storage
drop policy if exists "Allow authenticated users to upload avatars" on storage.objects;
create policy "Allow authenticated users to upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "Allow authenticated users to update their own avatar" on storage.objects;
create policy "Allow authenticated users to update their own avatar" on storage.objects for update to authenticated with check (bucket_id = 'avatars' and (storage.owner_id (owner)::text = auth.uid ()::text));

drop policy if exists "Allow authenticated users to delete their own avatar" on storage.objects;
create policy "Allow authenticated users to delete their own avatar" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.owner_id (owner)::text = auth.uid ()::text));

drop policy if exists "Allow public read access to avatars" on storage.objects;
create policy "Allow public read access to avatars" on storage.objects for select using (bucket_id = 'avatars');
