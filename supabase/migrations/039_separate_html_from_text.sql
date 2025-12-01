-- Migration: Separate HTML from Plain Text Fields
-- Moves HTML content to separate _html fields and stores plain text in main fields
-- This allows admin forms to show clean text while preserving HTML for frontend display

-- Function to strip HTML tags and return plain text
CREATE OR REPLACE FUNCTION strip_html_tags(html_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF html_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  result := html_text;
  
  -- Remove HTML comments
  result := regexp_replace(result, '<!--[\s\S]*?-->', '', 'g');
  
  -- Remove script and style tags and their content
  result := regexp_replace(result, '<script[\s\S]*?</script>', '', 'gi');
  result := regexp_replace(result, '<style[\s\S]*?</style>', '', 'gi');
  
  -- Remove HTML tags
  result := regexp_replace(result, '<[^>]+>', ' ', 'g');
  
  -- Decode HTML entities
  result := REPLACE(result, '&nbsp;', ' ');
  result := REPLACE(result, '&lt;', '<');
  result := REPLACE(result, '&gt;', '>');
  result := REPLACE(result, '&quot;', '"');
  result := REPLACE(result, '&#39;', '''');
  result := REPLACE(result, '&apos;', '''');
  result := REPLACE(result, '&amp;', '&'); -- Must be last
  
  -- Normalize whitespace
  result := regexp_replace(result, '\s+', ' ', 'g');
  result := regexp_replace(result, '\n\s*\n', E'\n\n', 'g');
  result := trim(result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if text contains HTML
CREATE OR REPLACE FUNCTION contains_html(text_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF text_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN text_value ~* '<[^>]+>' OR text_value ~* '&[a-z]+;|&#\d+;|&#x[0-9a-f]+;';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add HTML storage columns to law_firms
ALTER TABLE law_firms
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add HTML storage column to lawyers
ALTER TABLE lawyers
ADD COLUMN IF NOT EXISTS bio_html TEXT;

-- Add HTML storage columns to articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS excerpt_html TEXT;

-- Add HTML storage columns to cities, counties, states
ALTER TABLE cities
ADD COLUMN IF NOT EXISTS content_html TEXT;

ALTER TABLE counties
ADD COLUMN IF NOT EXISTS content_html TEXT;

ALTER TABLE states
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add HTML storage columns to stages
ALTER TABLE stages
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add HTML storage columns to team_members
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS bio_html TEXT;

-- Add HTML storage columns to questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_html TEXT,
ADD COLUMN IF NOT EXISTS answer_html TEXT;

-- Add HTML storage columns to emotions
ALTER TABLE emotions
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add HTML storage columns to videos
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS description_html TEXT,
ADD COLUMN IF NOT EXISTS transcript_html TEXT;

-- Add HTML storage columns to article_categories
ALTER TABLE article_categories
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Add HTML storage columns to content_blocks
ALTER TABLE content_blocks
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Add HTML storage columns to markets
ALTER TABLE markets
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Move HTML content to _html fields and strip HTML from main fields for law_firms
UPDATE law_firms
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END,
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(description) OR contains_html(content);

-- Move HTML content to _html fields and strip HTML from main fields for lawyers
UPDATE lawyers
SET 
  bio_html = CASE 
    WHEN contains_html(bio) THEN bio 
    ELSE NULL 
  END,
  bio = CASE 
    WHEN contains_html(bio) THEN strip_html_tags(bio)
    ELSE bio
  END
WHERE contains_html(bio);

-- Update articles table
UPDATE articles
SET 
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END,
  excerpt_html = CASE 
    WHEN contains_html(excerpt) THEN excerpt 
    ELSE NULL 
  END,
  excerpt = CASE 
    WHEN contains_html(excerpt) THEN strip_html_tags(excerpt)
    ELSE excerpt
  END
WHERE contains_html(content) OR contains_html(excerpt);

-- Update cities table
UPDATE cities
SET 
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(content);

-- Update counties table
UPDATE counties
SET 
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(content);

-- Update states table
UPDATE states
SET 
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(content);

-- Update stages table
UPDATE stages
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END,
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(description) OR contains_html(content);

-- Update team_members table
UPDATE team_members
SET 
  bio_html = CASE 
    WHEN contains_html(bio) THEN bio 
    ELSE NULL 
  END,
  bio = CASE 
    WHEN contains_html(bio) THEN strip_html_tags(bio)
    ELSE bio
  END
WHERE contains_html(bio);

-- Update questions table
UPDATE questions
SET 
  question_html = CASE 
    WHEN contains_html(question) THEN question 
    ELSE NULL 
  END,
  question = CASE 
    WHEN contains_html(question) THEN strip_html_tags(question)
    ELSE question
  END,
  answer_html = CASE 
    WHEN contains_html(answer) THEN answer 
    ELSE NULL 
  END,
  answer = CASE 
    WHEN contains_html(answer) THEN strip_html_tags(answer)
    ELSE answer
  END
WHERE contains_html(question) OR contains_html(answer);

-- Update emotions table
UPDATE emotions
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END,
  content_html = CASE 
    WHEN contains_html(content) THEN content 
    ELSE NULL 
  END,
  content = CASE 
    WHEN contains_html(content) THEN strip_html_tags(content)
    ELSE content
  END
WHERE contains_html(description) OR contains_html(content);

-- Update videos table
UPDATE videos
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END,
  transcript_html = CASE 
    WHEN contains_html(transcript) THEN transcript 
    ELSE NULL 
  END,
  transcript = CASE 
    WHEN contains_html(transcript) THEN strip_html_tags(transcript)
    ELSE transcript
  END
WHERE contains_html(description) OR contains_html(transcript);

-- Update article_categories table
UPDATE article_categories
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END
WHERE contains_html(description);

-- Update content_blocks table
UPDATE content_blocks
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END
WHERE contains_html(description);

-- Update markets table
UPDATE markets
SET 
  description_html = CASE 
    WHEN contains_html(description) THEN description 
    ELSE NULL 
  END,
  description = CASE 
    WHEN contains_html(description) THEN strip_html_tags(description)
    ELSE description
  END
WHERE contains_html(description);

-- Log the changes
DO $$
DECLARE
  firms_updated INTEGER;
  lawyers_updated INTEGER;
  articles_updated INTEGER;
  locations_updated INTEGER;
  stages_updated INTEGER;
  team_updated INTEGER;
  questions_updated INTEGER;
  emotions_updated INTEGER;
  videos_updated INTEGER;
  categories_updated INTEGER;
  content_blocks_updated INTEGER;
  markets_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO firms_updated FROM law_firms WHERE description_html IS NOT NULL OR content_html IS NOT NULL;
  SELECT COUNT(*) INTO lawyers_updated FROM lawyers WHERE bio_html IS NOT NULL;
  SELECT COUNT(*) INTO articles_updated FROM articles WHERE content_html IS NOT NULL OR excerpt_html IS NOT NULL;
  SELECT 
    (SELECT COUNT(*) FROM cities WHERE content_html IS NOT NULL) +
    (SELECT COUNT(*) FROM counties WHERE content_html IS NOT NULL) +
    (SELECT COUNT(*) FROM states WHERE content_html IS NOT NULL)
  INTO locations_updated;
  SELECT COUNT(*) INTO stages_updated FROM stages WHERE description_html IS NOT NULL OR content_html IS NOT NULL;
  SELECT COUNT(*) INTO team_updated FROM team_members WHERE bio_html IS NOT NULL;
  SELECT COUNT(*) INTO questions_updated FROM questions WHERE question_html IS NOT NULL OR answer_html IS NOT NULL;
  SELECT COUNT(*) INTO emotions_updated FROM emotions WHERE description_html IS NOT NULL OR content_html IS NOT NULL;
  SELECT COUNT(*) INTO videos_updated FROM videos WHERE description_html IS NOT NULL OR transcript_html IS NOT NULL;
  SELECT COUNT(*) INTO categories_updated FROM article_categories WHERE description_html IS NOT NULL;
  SELECT COUNT(*) INTO content_blocks_updated FROM content_blocks WHERE description_html IS NOT NULL;
  SELECT COUNT(*) INTO markets_updated FROM markets WHERE description_html IS NOT NULL;
  
  RAISE NOTICE 'HTML separated from plain text. Updated: Firms: %, Lawyers: %, Articles: %, Locations: %, Stages: %, Team: %, Questions: %, Emotions: %, Videos: %, Categories: %, Content Blocks: %, Markets: %', 
    firms_updated, lawyers_updated, articles_updated, locations_updated, stages_updated, team_updated, questions_updated, emotions_updated, videos_updated, categories_updated, content_blocks_updated, markets_updated;
END $$;

