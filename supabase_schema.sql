
-- Create Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    roles text[] NOT NULL,
    email text,
    phone text,
    avatar text
);

-- Create Songs Table
CREATE TABLE IF NOT EXISTS public.songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    artist text,
    key text,
    category text,
    "isNew" boolean DEFAULT false,
    "youtubeUrl" text,
    lyrics text,
    chords text,
    "timesPlayedQuarterly" integer,
    "timesPlayedTotal" integer,
    bpm integer,
    UNIQUE(title, artist)
);

-- Create Monthly Schedules Table
CREATE TABLE IF NOT EXISTS public.monthly_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date timestamp with time zone NOT NULL UNIQUE,
    assignments jsonb,
    playlist_manha text[],
    playlist_noite text[],
    "isFeatured" boolean DEFAULT false,
    name_manha text,
    name_noite text
);


-- Create Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;


-- RLS Policies for tables (assuming you want authenticated users to be able to do everything for now)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access" ON public.members;
CREATE POLICY "Allow public read-only access" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage members" ON public.members;
CREATE POLICY "Allow authenticated users to manage members" ON public.members FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public read-only access" ON public.songs;
CREATE POLICY "Allow public read-only access" ON public.songs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage songs" ON public.songs;
CREATE POLICY "Allow authenticated users to manage songs" ON public.songs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public read-only access" ON public.monthly_schedules;
CREATE POLICY "Allow public read-only access" ON public.monthly_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage schedules" ON public.monthly_schedules;
CREATE POLICY "Allow authenticated users to manage schedules" ON public.monthly_schedules FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for 'avatars' bucket in storage
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
TO public
USING ( (select auth.uid()::text) = owner_id::text );

DROP POLICY IF EXISTS "Anyone can delete their own avatar." ON storage.objects;
CREATE POLICY "Anyone can delete their own avatar."
ON storage.objects FOR DELETE
TO public
USING ( (select auth.uid()::text) = owner_id::text );
