-- Migration: Add meta_title and meta_description to lawyers table if they don't exist
-- These fields are used for SEO

-- Add meta_title if it doesn't exist
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- Add meta_description if it doesn't exist
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add indexes for SEO fields
CREATE INDEX IF NOT EXISTS idx_lawyers_meta_title ON lawyers(meta_title);
CREATE INDEX IF NOT EXISTS idx_lawyers_meta_description ON lawyers(meta_description);

