-- Safe Schema Update Script
-- Adds missing columns and tables without errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add latitude/longitude to cities if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cities' AND column_name = 'latitude') THEN
    ALTER TABLE cities ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cities' AND column_name = 'longitude') THEN
    ALTER TABLE cities ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Add published_at to videos if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'videos' AND column_name = 'published_at') THEN
    ALTER TABLE videos ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================

-- Create team_members table if it doesn't exist
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

-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES (SAFE)
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

-- Zip codes indexes (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zip_codes') THEN
    CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_code ON zip_codes(zip_code);
    CREATE INDEX IF NOT EXISTS idx_zip_codes_city_id ON zip_codes(city_id);
  END IF;
END $$;

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

-- Posts indexes (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
  END IF;
END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All missing columns, tables, and indexes have been added safely

