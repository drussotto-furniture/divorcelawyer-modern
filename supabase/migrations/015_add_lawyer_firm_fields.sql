-- Migration: Add missing fields to lawyers and law_firms tables
-- Adds bar admissions, publications, professional memberships, certifications, languages, social media, etc.

-- ============================================================================
-- PART 1: Add fields to LAWYERS table
-- ============================================================================

-- Bar admissions (states where admitted to practice)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS bar_admissions TEXT[];

-- Publications (articles, books, etc.)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS publications TEXT[];

-- Professional memberships (bar associations, legal organizations)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS professional_memberships TEXT[];

-- Certifications (board certifications, specializations)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Languages spoken
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Social media
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Practice focus and approach
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS practice_focus TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS approach TEXT;

-- Contact preferences
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS consultation_fee TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS accepts_new_clients BOOLEAN DEFAULT true;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS consultation_available BOOLEAN DEFAULT true;

-- Office information
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS office_address TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS office_hours TEXT;

-- Additional profile info
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS credentials_summary TEXT;

-- Media mentions and speaking engagements
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS media_mentions TEXT[];
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS speaking_engagements TEXT[];

-- ============================================================================
-- PART 2: Add fields to LAW_FIRMS table
-- ============================================================================

-- Social media
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Additional firm info
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS firm_size TEXT;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS practice_areas TEXT[];

-- ============================================================================
-- PART 3: Add indexes for new array fields
-- ============================================================================

-- GIN indexes for array fields (for searching within arrays)
CREATE INDEX IF NOT EXISTS idx_lawyers_bar_admissions ON lawyers USING GIN(bar_admissions);
CREATE INDEX IF NOT EXISTS idx_lawyers_publications ON lawyers USING GIN(publications);
CREATE INDEX IF NOT EXISTS idx_lawyers_professional_memberships ON lawyers USING GIN(professional_memberships);
CREATE INDEX IF NOT EXISTS idx_lawyers_certifications ON lawyers USING GIN(certifications);
CREATE INDEX IF NOT EXISTS idx_lawyers_languages ON lawyers USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_lawyers_media_mentions ON lawyers USING GIN(media_mentions);
CREATE INDEX IF NOT EXISTS idx_lawyers_speaking_engagements ON lawyers USING GIN(speaking_engagements);
CREATE INDEX IF NOT EXISTS idx_law_firms_practice_areas ON law_firms USING GIN(practice_areas);

