-- ========================================
-- MIGRATION 041: Page Tags Support
-- ========================================
-- Adds support for assigning tags to any page on the website
-- Uses a polymorphic approach with content_type and content_id

-- Create page_tags table for linking tags to any content type
CREATE TABLE IF NOT EXISTS page_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL, -- 'article', 'post', 'page', 'stage', 'emotion', etc.
  content_id TEXT NOT NULL, -- ID or slug of the content (UUID for articles/posts, slug for static pages)
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_page_tags_content ON page_tags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_tag_id ON page_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_content_type ON page_tags(content_type);

-- Add comment for documentation
COMMENT ON TABLE page_tags IS 'Polymorphic table for linking tags to any content type (articles, posts, pages, stages, emotions, etc.)';
COMMENT ON COLUMN page_tags.content_type IS 'Type of content: article, post, page, stage, emotion, video, question, etc.';
COMMENT ON COLUMN page_tags.content_id IS 'ID or slug of the content item (UUID for articles/posts, slug for static pages like "home" or "connect-with-lawyer")';

