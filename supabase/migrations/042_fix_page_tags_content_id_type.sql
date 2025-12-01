-- ========================================
-- MIGRATION 042: Fix page_tags content_id Type
-- ========================================
-- Changes content_id from UUID to TEXT to support both UUIDs and slugs

-- First, drop the foreign key constraint if it exists (though there shouldn't be one for content_id)
-- Then alter the column type
ALTER TABLE page_tags 
  ALTER COLUMN content_id TYPE TEXT;

-- Update the comment
COMMENT ON COLUMN page_tags.content_id IS 'ID or slug of the content item (UUID for articles/posts, slug for static pages like "home" or "connect-with-lawyer")';



