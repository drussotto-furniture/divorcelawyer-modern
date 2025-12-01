-- Migration: Decode HTML Entities in Database
-- Fixes &amp; -> & and other HTML entities that were incorrectly stored during WordPress migration
-- Updates law_firms, lawyers, and other tables that may contain HTML entities

-- Function to decode common HTML entities
CREATE OR REPLACE FUNCTION decode_html_entities(text_value TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF text_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  result := text_value;
  
  -- Common HTML entities (order matters - do &amp; last among & entities)
  result := REPLACE(result, '&lt;', '<');
  result := REPLACE(result, '&gt;', '>');
  result := REPLACE(result, '&quot;', '"');
  result := REPLACE(result, '&#39;', '''');
  result := REPLACE(result, '&apos;', '''');
  result := REPLACE(result, '&nbsp;', ' ');
  result := REPLACE(result, '&amp;', '&'); -- Must be last to avoid double replacement
  
  -- Numeric entities (common ones)
  result := REPLACE(result, '&#38;', '&');
  result := REPLACE(result, '&#60;', '<');
  result := REPLACE(result, '&#62;', '>');
  result := REPLACE(result, '&#34;', '"');
  result := REPLACE(result, '&#160;', ' ');
  
  -- Hex entities
  result := REPLACE(result, '&#x26;', '&');
  result := REPLACE(result, '&#x3C;', '<');
  result := REPLACE(result, '&#x3E;', '>');
  result := REPLACE(result, '&#x22;', '"');
  result := REPLACE(result, '&#x27;', '''');
  result := REPLACE(result, '&#xA0;', ' ');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update law_firms table
UPDATE law_firms
SET 
  name = decode_html_entities(name),
  description = decode_html_entities(description),
  content = decode_html_entities(content),
  address = decode_html_entities(address),
  street_address = decode_html_entities(street_address),
  address_line_2 = decode_html_entities(address_line_2),
  meta_title = decode_html_entities(meta_title),
  meta_description = decode_html_entities(meta_description)
WHERE 
  name LIKE '%&amp;%' 
  OR name LIKE '%&lt;%' 
  OR name LIKE '%&gt;%' 
  OR name LIKE '%&quot;%'
  OR description LIKE '%&amp;%'
  OR content LIKE '%&amp;%'
  OR address LIKE '%&amp;%'
  OR street_address LIKE '%&amp;%'
  OR address_line_2 LIKE '%&amp;%'
  OR meta_title LIKE '%&amp;%'
  OR meta_description LIKE '%&amp;%';

-- Update lawyers table
UPDATE lawyers
SET 
  first_name = decode_html_entities(first_name),
  last_name = decode_html_entities(last_name),
  title = decode_html_entities(title),
  bio = decode_html_entities(bio),
  office_address = decode_html_entities(office_address),
  office_street_address = decode_html_entities(office_street_address),
  office_address_line_2 = decode_html_entities(office_address_line_2),
  credentials_summary = decode_html_entities(credentials_summary),
  practice_focus = decode_html_entities(practice_focus),
  approach = decode_html_entities(approach),
  meta_title = decode_html_entities(meta_title),
  meta_description = decode_html_entities(meta_description)
WHERE 
  first_name LIKE '%&amp;%' 
  OR last_name LIKE '%&amp;%'
  OR title LIKE '%&amp;%'
  OR bio LIKE '%&amp;%'
  OR office_address LIKE '%&amp;%'
  OR office_street_address LIKE '%&amp;%'
  OR office_address_line_2 LIKE '%&amp;%'
  OR credentials_summary LIKE '%&amp;%'
  OR practice_focus LIKE '%&amp;%'
  OR approach LIKE '%&amp;%'
  OR meta_title LIKE '%&amp;%'
  OR meta_description LIKE '%&amp;%';

-- Update articles table
UPDATE articles
SET 
  title = decode_html_entities(title),
  content = decode_html_entities(content),
  excerpt = decode_html_entities(excerpt),
  meta_title = decode_html_entities(meta_title),
  meta_description = decode_html_entities(meta_description)
WHERE 
  title LIKE '%&amp;%' 
  OR content LIKE '%&amp;%'
  OR excerpt LIKE '%&amp;%'
  OR meta_title LIKE '%&amp;%'
  OR meta_description LIKE '%&amp;%';

-- Update cities table
UPDATE cities
SET 
  name = decode_html_entities(name),
  content = decode_html_entities(content),
  meta_title = decode_html_entities(meta_title),
  meta_description = decode_html_entities(meta_description)
WHERE 
  name LIKE '%&amp;%' 
  OR content LIKE '%&amp;%'
  OR meta_title LIKE '%&amp;%'
  OR meta_description LIKE '%&amp;%';

-- Update states table
UPDATE states
SET 
  name = decode_html_entities(name),
  content = decode_html_entities(content),
  meta_title = decode_html_entities(meta_title),
  meta_description = decode_html_entities(meta_description)
WHERE 
  name LIKE '%&amp;%' 
  OR content LIKE '%&amp;%'
  OR meta_title LIKE '%&amp;%'
  OR meta_description LIKE '%&amp;%';

-- Log the changes
DO $$
DECLARE
  firms_fixed INTEGER;
  lawyers_fixed INTEGER;
  articles_fixed INTEGER;
BEGIN
  SELECT COUNT(*) INTO firms_fixed
  FROM law_firms
  WHERE name NOT LIKE '%&amp;%' AND name NOT LIKE '%&lt;%' AND name NOT LIKE '%&gt;%' AND name NOT LIKE '%&quot;%';
  
  SELECT COUNT(*) INTO lawyers_fixed
  FROM lawyers
  WHERE first_name NOT LIKE '%&amp;%' AND last_name NOT LIKE '%&amp;%';
  
  RAISE NOTICE 'HTML entities decoded. Law firms and lawyers updated.';
END $$;

-- Note: The decode_html_entities function uses regex_replace which requires the pg_trgm extension
-- If the function doesn't work, we'll use a simpler approach with REPLACE

