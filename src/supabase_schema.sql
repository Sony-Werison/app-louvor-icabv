-- Drop existing tables and types to start fresh, handling dependencies.
DROP TABLE IF EXISTS "monthly_schedules" CASCADE;
DROP TABLE IF EXISTS "songs" CASCADE;
DROP TABLE IF EXISTS "members" CASCADE;
DROP TYPE IF EXISTS "member_role";
DROP TYPE IF EXISTS "song_category";

-- Create ENUM types for roles and categories.
CREATE TYPE "member_role" AS ENUM ('Abertura', 'Pregação', 'Multimídia', 'Convidado');
CREATE TYPE "song_category" AS ENUM ('Hino', 'Louvor', 'Infantil');

-- Create members table
CREATE TABLE "members" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "avatar" text,
  "roles" _member_role,
  CONSTRAINT "members_email_key" UNIQUE ("email")
);

-- Create songs table
CREATE TABLE "songs" (
  "id" text NOT NULL PRIMARY KEY,
  "title" text NOT NULL,
  "artist" text,
  "category" song_category,
  "key" text,
  "isNew" boolean,
  "youtubeUrl" text,
  "lyrics" text,
  "chords" text,
  "timesPlayedQuarterly" integer,
  "timesPlayedTotal" integer,
  "bpm" integer,
  CONSTRAINT "songs_title_artist_key" UNIQUE ("title", "artist")
);

-- Create monthly_schedules table
CREATE TABLE "monthly_schedules" (
  "id" text NOT NULL PRIMARY KEY,
  "date" timestamp with time zone NOT NULL,
  "assignments" jsonb,
  "playlist_manha" text[],
  "playlist_noite" text[],
  "isFeatured" boolean,
  "name_manha" text,
  "name_noite" text,
  CONSTRAINT "monthly_schedules_date_key" UNIQUE ("date")
);

-- Enable Row Level Security for all tables
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "songs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monthly_schedules" ENABLE ROW LEVEL SECURITY;

-- Policies for members table
DROP POLICY IF EXISTS "allow_all_for_authenticated" ON "members";
CREATE POLICY "allow_all_for_authenticated" ON "members" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for songs table
DROP POLICY IF EXISTS "allow_all_for_authenticated" ON "songs";
CREATE POLICY "allow_all_for_authenticated" ON "songs" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for monthly_schedules table
DROP POLICY IF EXISTS "allow_all_for_authenticated" ON "monthly_schedules";
CREATE POLICY "allow_all_for_authenticated" ON "monthly_schedules" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage.objects
DROP POLICY IF EXISTS "allow_authenticated_select" ON "storage"."objects";
CREATE POLICY "allow_authenticated_select" ON "storage"."objects" FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "allow_authenticated_insert" ON "storage"."objects";
CREATE POLICY "allow_authenticated_insert" ON "storage"."objects" FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "allow_authenticated_update" ON "storage"."objects";
CREATE POLICY "allow_authenticated_update" ON "storage"."objects" FOR UPDATE TO authenticated USING (
  auth.uid() = owner
);

DROP POLICY IF EXISTS "allow_authenticated_delete" ON "storage"."objects";
CREATE POLICY "allow_authenticated_delete" ON "storage"."objects" FOR DELETE TO authenticated USING (
  auth.uid() = owner
);
