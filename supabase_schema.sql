-- Create members table
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    roles TEXT[] NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT
);

-- Create songs table
CREATE TABLE public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT,
    key TEXT,
    category TEXT,
    isNew BOOLEAN DEFAULT false,
    youtubeUrl TEXT,
    lyrics TEXT,
    chords TEXT,
    bpm INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT songs_title_artist_key UNIQUE (title, artist)
);

-- Create monthly_schedules table
CREATE TABLE public.monthly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    assignments JSONB,
    playlist_manha UUID[],
    playlist_noite UUID[],
    isFeatured BOOLEAN DEFAULT false,
    name_manha TEXT,
    name_noite TEXT,
    UNIQUE(date)
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Public members are viewable by everyone." ON public.members FOR SELECT USING (true);
CREATE POLICY "Public songs are viewable by everyone." ON public.songs FOR SELECT USING (true);
CREATE POLICY "Public schedules are viewable by everyone." ON public.monthly_schedules FOR SELECT USING (true);

-- For authenticated users to be able to insert/update/delete
CREATE POLICY "Allow all operations for authenticated users" ON public.members FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON public.songs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON public.monthly_schedules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Create a bucket for member avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Policies for avatars bucket
-- Allow public read access to all files in the 'avatars' bucket
CREATE POLICY "Public read access for avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- Allow authenticated users to upload, update, and delete their own avatar
CREATE POLICY "Authenticated users can manage their own avatars" ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
