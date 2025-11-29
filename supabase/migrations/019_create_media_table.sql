-- Migration: Create Media Table
-- Creates the media table for storing media library metadata

-- Create media table if it doesn't exist
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  storage_url TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID, -- Can reference auth.users if needed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media(wordpress_id);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_media_updated_at') THEN
    CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies for media are already created in migration 017_add_admin_policies_for_content.sql

