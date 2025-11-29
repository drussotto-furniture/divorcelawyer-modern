-- Comprehensive Schema Fix Script
-- Adds all missing columns before creating indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: ADD ALL MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add missing columns to states
DO $$ 
BEGIN
  ALTER TABLE states ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE states ADD COLUMN IF NOT EXISTS meta_title TEXT;
END $$;

-- Add missing columns to counties
DO $$ 
BEGIN
  ALTER TABLE counties ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE counties ADD COLUMN IF NOT EXISTS meta_title TEXT;
END $$;

-- Add missing columns to cities
DO $$ 
BEGIN
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS meta_title TEXT;
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS population INTEGER;
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
  ALTER TABLE cities ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
END $$;

-- Add missing columns to law_firms
DO $$ 
BEGIN
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS city_id UUID;
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
  ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
END $$;

-- Add missing columns to lawyers
DO $$ 
BEGIN
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS photo_url TEXT;
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS bar_number TEXT;
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS years_experience INTEGER;
  ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS specializations TEXT[];
END $$;

-- Add missing columns to articles
DO $$ 
BEGIN
  ALTER TABLE articles ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id UUID;
  ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
  ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_title TEXT;
  ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
END $$;

-- Add missing columns to article_categories
DO $$ 
BEGIN
  ALTER TABLE article_categories ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
END $$;

-- Add missing columns to videos
DO $$ 
BEGIN
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_provider TEXT;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_id TEXT;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS transcript TEXT;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
  
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'videos_status_check') THEN
    ALTER TABLE videos ADD CONSTRAINT videos_status_check CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- Add missing columns to questions
DO $$ 
BEGIN
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
END $$;

-- Add missing columns to stages
DO $$ 
BEGIN
  ALTER TABLE stages ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE stages ADD COLUMN IF NOT EXISTS order_index INTEGER;
END $$;

-- Add missing columns to emotions
DO $$ 
BEGIN
  ALTER TABLE emotions ADD COLUMN IF NOT EXISTS wordpress_id INTEGER UNIQUE;
  ALTER TABLE emotions ADD COLUMN IF NOT EXISTS coping_strategies TEXT[];
END $$;

-- ============================================================================
-- PART 2: CREATE MISSING TABLES
-- ============================================================================

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  order_index INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create zip_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS zip_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  city_id UUID,
  zip_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: CREATE ALL INDEXES
-- ============================================================================

-- States indexes
CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);
CREATE INDEX IF NOT EXISTS idx_states_abbreviation ON states(abbreviation);

-- Counties indexes
CREATE INDEX IF NOT EXISTS idx_counties_slug ON counties(slug);
CREATE INDEX IF NOT EXISTS idx_counties_state_id ON counties(state_id);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_county_id ON cities(county_id);
CREATE INDEX IF NOT EXISTS idx_cities_coordinates ON cities(latitude, longitude);

-- Zip codes indexes
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_code ON zip_codes(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city_id ON zip_codes(city_id);

-- Law firms indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_slug ON law_firms(slug);
CREATE INDEX IF NOT EXISTS idx_law_firms_city_id ON law_firms(city_id);
CREATE INDEX IF NOT EXISTS idx_law_firms_verified ON law_firms(verified);

-- Lawyers indexes
CREATE INDEX IF NOT EXISTS idx_lawyers_slug ON lawyers(slug);
CREATE INDEX IF NOT EXISTS idx_lawyers_law_firm_id ON lawyers(law_firm_id);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);

-- Article categories indexes
CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);

-- Videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_slug ON questions(slug);

-- Stages indexes
CREATE INDEX IF NOT EXISTS idx_stages_slug ON stages(slug);
CREATE INDEX IF NOT EXISTS idx_stages_order_index ON stages(order_index);

-- Emotions indexes
CREATE INDEX IF NOT EXISTS idx_emotions_slug ON emotions(slug);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_slug ON team_members(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Schema has been safely updated with all missing columns, tables, and indexes

