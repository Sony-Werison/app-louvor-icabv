-- supabase_schema.sql

-- This script can be executed in the Supabase SQL editor.
-- It's idempotent, so it can be run multiple times without causing errors.

-- 1. Create Storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Row Level Security (RLS) for the avatars bucket
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access on avatars" ON storage.objects;
CREATE POLICY "Allow public read access on avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (auth.uid()::text = owner::text);

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid()::text = owner::text);


-- 3. Create tables

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    roles TEXT[],
    email TEXT,
    phone TEXT,
    avatar TEXT
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    key TEXT,
    category TEXT,
    isNew BOOLEAN DEFAULT false,
    youtubeUrl TEXT,
    lyrics TEXT,
    chords TEXT,
    timesPlayedQuarterly INT DEFAULT 0,
    timesPlayedTotal INT DEFAULT 0
);

-- Create monthly_schedules table
CREATE TABLE IF NOT EXISTS monthly_schedules (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    assignments JSONB,
    playlist_manha TEXT[],
    playlist_noite TEXT[],
    isFeatured BOOLEAN DEFAULT false,
    name_manha TEXT,
    name_noite TEXT
);

-- 4. Enable Row Level Security (RLS) for the tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the tables (allow all access to authenticated users)

-- Members policies
DROP POLICY IF EXISTS "Allow all access to authenticated users on members" ON public.members;
CREATE POLICY "Allow all access to authenticated users on members" ON public.members
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Songs policies
DROP POLICY IF EXISTS "Allow all access to authenticated users on songs" ON public.songs;
CREATE POLICY "Allow all access to authenticated users on songs" ON public.songs
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Monthly schedules policies
DROP POLICY IF EXISTS "Allow all access to authenticated users on monthly_schedules" ON public.monthly_schedules;
CREATE POLICY "Allow all access to authenticated users on monthly_schedules" ON public.monthly_schedules
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Public read access policies

-- Members policies
DROP POLICY IF EXISTS "Allow public read access on members" ON public.members;
CREATE POLICY "Allow public read access on members" ON public.members
FOR SELECT TO public
USING (true);

-- Songs policies
DROP POLICY IF EXISTS "Allow public read access on songs" ON public.songs;
CREATE POLICY "Allow public read access on songs" ON public.songs
FOR SELECT TO public
USING (true);

-- Monthly schedules policies
DROP POLICY IF EXISTS "Allow public read access on monthly_schedules" ON public.monthly_schedules;
CREATE POLICY "Allow public read access on monthly_schedules" ON public.monthly_schedules
FOR SELECT TO public
USING (true);
