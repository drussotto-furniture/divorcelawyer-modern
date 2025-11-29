-- Migration: Add wordpress_id column to zip_codes table if it doesn't exist
-- This fixes the issue where zip codes migration fails due to missing column

ALTER TABLE zip_codes ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_zip_codes_wordpress_id ON zip_codes(wordpress_id);

