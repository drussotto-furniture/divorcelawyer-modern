-- ========================================
-- MIGRATION 040: Create Tags Table
-- ========================================
-- Creates the tags table for managing content tags

-- Tags (general purpose tags for content)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_wordpress_id ON tags(wordpress_id);

-- Add comment for documentation
COMMENT ON TABLE tags IS 'General purpose tags that can be assigned to any content type';
COMMENT ON COLUMN tags.wordpress_id IS 'WordPress tag ID if migrated from WordPress';



