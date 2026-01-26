-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT
);

-- Create songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  key TEXT,
  category TEXT,
  isNew BOOLEAN DEFAULT false,
  youtubeUrl TEXT,
  lyrics TEXT,
  chords TEXT,
  bpm INT
);

-- Create monthly_schedules table
CREATE TABLE monthly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  assignments JSONB,
  playlist_manha UUID[],
  playlist_noite UUID[],
  isFeatured BOOLEAN DEFAULT false,
  name_manha TEXT,
  name_noite TEXT
);


-- Enable Row Level Security for all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for public access (or authenticated access)
-- WARNING: This allows any user to read data. Adjust as needed.
CREATE POLICY "Allow public read access" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON monthly_schedules FOR SELECT USING (true);

-- Policies for authenticated users to modify data
-- This allows any logged-in user to insert, update, or delete.
CREATE POLICY "Allow authenticated users to modify" ON members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify" ON songs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to modify" ON monthly_schedules FOR ALL USING (auth.role() = 'authenticated');

-- Storage policies for avatars
-- 1. Create a bucket called "avatars" in your Supabase dashboard.
-- 2. Make the bucket public.
-- 3. Add these policies in the Supabase SQL editor.

CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Allow authenticated users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner_id );
