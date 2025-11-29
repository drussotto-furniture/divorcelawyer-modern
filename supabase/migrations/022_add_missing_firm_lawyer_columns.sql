-- Migration: Add missing columns to law_firms and lawyers tables
-- These columns are expected by the admin forms but don't exist in the database
-- This aligns the database schema with what the UI components expect

-- ============================================================================
-- PART 1: Add missing columns to LAW_FIRMS table
-- ============================================================================

-- Content field (for HTML content managed by super admin)
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS content TEXT;

-- Logo URL
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Review count
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Featured status
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- SEO fields
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_law_firms_featured ON law_firms(featured);
CREATE INDEX IF NOT EXISTS idx_law_firms_meta_title ON law_firms(meta_title);

-- ============================================================================
-- PART 2: Add missing columns to LAWYERS table
-- ============================================================================

-- Rating (if it doesn't exist - check schema first)
-- Note: schema.sql shows rating exists, but if it doesn't in actual DB, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'rating'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN rating DECIMAL(3,2);
  END IF;
END $$;

-- Review count (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Verified status (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'verified'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Featured status (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'featured'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Meta title (migration 020 should have added this, but check anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN meta_title TEXT;
  END IF;
END $$;

-- Meta description (migration 020 should have added this, but check anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN meta_description TEXT;
  END IF;
END $$;

-- Create indexes for new columns (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_lawyers_verified ON lawyers(verified);
CREATE INDEX IF NOT EXISTS idx_lawyers_featured ON lawyers(featured);
CREATE INDEX IF NOT EXISTS idx_lawyers_meta_title ON lawyers(meta_title);
CREATE INDEX IF NOT EXISTS idx_lawyers_meta_description ON lawyers(meta_description);

-- ============================================================================
-- Summary
-- ============================================================================
-- Added to law_firms:
--   - content (TEXT)
--   - logo_url (TEXT)
--   - review_count (INTEGER, default 0)
--   - featured (BOOLEAN, default false)
--   - meta_title (TEXT)
--   - meta_description (TEXT)
--
-- Added to lawyers (if missing):
--   - rating (DECIMAL(3,2))
--   - review_count (INTEGER, default 0)
--   - verified (BOOLEAN, default false)
--   - featured (BOOLEAN, default false)
--   - meta_title (TEXT)
--   - meta_description (TEXT)

