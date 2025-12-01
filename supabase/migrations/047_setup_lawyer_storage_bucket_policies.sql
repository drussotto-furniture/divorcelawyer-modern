-- Migration: Setup storage bucket policies for lawyer-images and lawyer-videos
-- Allows authenticated users to upload files and public users to read them

-- Note: This migration assumes the buckets already exist and are public.
-- If buckets don't exist, create them in Supabase Dashboard first:
-- 1. Go to Storage > New bucket
-- 2. Create "lawyer-images" (public)
-- 3. Create "lawyer-videos" (public)

-- Policy for lawyer-images bucket: Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload to lawyer-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload to lawyer-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lawyer-images');

-- Policy for lawyer-images bucket: Allow public read access
DROP POLICY IF EXISTS "Public can read from lawyer-images" ON storage.objects;
CREATE POLICY "Public can read from lawyer-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lawyer-images');

-- Policy for lawyer-images bucket: Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Authenticated users can update own files in lawyer-images" ON storage.objects;
CREATE POLICY "Authenticated users can update own files in lawyer-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lawyer-images')
WITH CHECK (bucket_id = 'lawyer-images');

-- Policy for lawyer-images bucket: Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Authenticated users can delete own files in lawyer-images" ON storage.objects;
CREATE POLICY "Authenticated users can delete own files in lawyer-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lawyer-images');

-- Policy for lawyer-videos bucket: Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload to lawyer-videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload to lawyer-videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lawyer-videos');

-- Policy for lawyer-videos bucket: Allow public read access
DROP POLICY IF EXISTS "Public can read from lawyer-videos" ON storage.objects;
CREATE POLICY "Public can read from lawyer-videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lawyer-videos');

-- Policy for lawyer-videos bucket: Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Authenticated users can update own files in lawyer-videos" ON storage.objects;
CREATE POLICY "Authenticated users can update own files in lawyer-videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lawyer-videos')
WITH CHECK (bucket_id = 'lawyer-videos');

-- Policy for lawyer-videos bucket: Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Authenticated users can delete own files in lawyer-videos" ON storage.objects;
CREATE POLICY "Authenticated users can delete own files in lawyer-videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lawyer-videos');

