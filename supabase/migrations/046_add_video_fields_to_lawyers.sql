-- Migration: Add video fields to lawyers table
-- Allows lawyers to have introduction videos

-- Add video_url column
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_storage_id column (for Supabase Storage reference)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS video_storage_id TEXT;

-- Add photo_storage_id column (for Supabase Storage reference)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS photo_storage_id TEXT;

-- Add comments
COMMENT ON COLUMN lawyers.video_url IS 'URL to lawyer introduction video (can be external URL or Supabase Storage URL)';
COMMENT ON COLUMN lawyers.video_storage_id IS 'Storage path in Supabase Storage bucket for uploaded video';
COMMENT ON COLUMN lawyers.photo_storage_id IS 'Storage path in Supabase Storage bucket for uploaded photo';

