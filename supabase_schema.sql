-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS members (
    id text PRIMARY KEY,
    name text NOT NULL,
    roles jsonb,
    email text,
    phone text,
    avatar text
);

CREATE TABLE IF NOT EXISTS songs (
    id text PRIMARY KEY,
    title text NOT NULL,
    artist text,
    key text,
    category text,
    "isNew" boolean DEFAULT false,
    "youtubeUrl" text,
    lyrics text,
    chords text,
    "timesPlayedQuarterly" integer DEFAULT 0,
    "timesPlayedTotal" integer DEFAULT 0,
    bpm integer
);

CREATE TABLE IF NOT EXISTS monthly_schedules (
    id text PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    assignments jsonb,
    playlist_manha text[],
    playlist_noite text[],
    "isFeatured" boolean DEFAULT false,
    name_manha text,
    name_noite text
);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public members are viewable by everyone." ON public.members;
CREATE POLICY "Public members are viewable by everyone." ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own members." ON public.members;
CREATE POLICY "Users can insert their own members." ON public.members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own members." ON public.members;
CREATE POLICY "Users can update their own members." ON public.members FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own members." ON public.members;
CREATE POLICY "Users can delete their own members." ON public.members FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public songs are viewable by everyone." ON public.songs;
CREATE POLICY "Public songs are viewable by everyone." ON public.songs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own songs." ON public.songs;
CREATE POLICY "Users can insert their own songs." ON public.songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own songs." ON public.songs;
CREATE POLICY "Users can update their own songs." ON public.songs FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own songs." ON public.songs;
CREATE POLICY "Users can delete their own songs." ON public.songs FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for monthly_schedules table
ALTER TABLE public.monthly_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public monthly_schedules are viewable by everyone." ON public.monthly_schedules;
CREATE POLICY "Public monthly_schedules are viewable by everyone." ON public.monthly_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own monthly_schedules." ON public.monthly_schedules;
CREATE POLICY "Users can insert their own monthly_schedules." ON public.monthly_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own monthly_schedules." ON public.monthly_schedules;
CREATE POLICY "Users can update their own monthly_schedules." ON public.monthly_schedules FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own monthly_schedules." ON public.monthly_schedules;
CREATE POLICY "Users can delete their own monthly_schedules." ON public.monthly_schedules FOR DELETE USING (auth.role() = 'authenticated');


-- Give users access to their own avatars
DROP POLICY IF EXISTS "owner_select_1m2j5x_0" ON storage.objects;
CREATE POLICY "owner_select_1m2j5x_0" ON storage.objects FOR SELECT USING (
    bucket_id = 'avatars' AND auth.uid()::text = owner::text
);

DROP POLICY IF EXISTS "owner_insert_1m2j5x_0" ON storage.objects;
CREATE POLICY "owner_insert_1m2j5x_0" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = owner::text
);

DROP POLICY IF EXISTS "owner_update_1m2j5x_0" ON storage.objects;
CREATE POLICY "owner_update_1m2j5x_0" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = owner::text
);

DROP POLICY IF EXISTS "owner_delete_1m2j5x_0" ON storage.objects;
CREATE POLICY "owner_delete_1m2j5x_0" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = owner::text
);
