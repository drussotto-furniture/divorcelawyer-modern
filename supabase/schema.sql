-- divorcelawyer.com Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOCATION TABLES
-- ============================================================================

-- States table
CREATE TABLE states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abbreviation TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_states_slug ON states(slug);
CREATE INDEX idx_states_abbreviation ON states(abbreviation);

-- Counties table
CREATE TABLE counties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  state_id UUID REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

CREATE INDEX idx_counties_slug ON counties(slug);
CREATE INDEX idx_counties_state_id ON counties(state_id);

-- Cities table
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  state_id UUID REFERENCES states(id) ON DELETE CASCADE,
  county_id UUID REFERENCES counties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  population INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_state_id ON cities(state_id);
CREATE INDEX idx_cities_county_id ON cities(county_id);
CREATE INDEX idx_cities_coordinates ON cities(latitude, longitude);

-- Zip codes table
CREATE TABLE zip_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zip_codes_zip ON zip_codes(zip_code);
CREATE INDEX idx_zip_codes_city_id ON zip_codes(city_id);

-- Markets table (geographic market areas)
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_markets_slug ON markets(slug);

-- ============================================================================
-- BUSINESS/DIRECTORY TABLES
-- ============================================================================

-- Law firms table
CREATE TABLE law_firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  address TEXT,
  city_id UUID REFERENCES cities(id),
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_law_firms_slug ON law_firms(slug);
CREATE INDEX idx_law_firms_city_id ON law_firms(city_id);
CREATE INDEX idx_law_firms_verified ON law_firms(verified);
CREATE INDEX idx_law_firms_featured ON law_firms(featured);

-- Lawyers table
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  law_firm_id UUID REFERENCES law_firms(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  bar_number TEXT,
  years_experience INTEGER,
  specializations TEXT[],
  education TEXT[],
  awards TEXT[],
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lawyers_slug ON lawyers(slug);
CREATE INDEX idx_lawyers_law_firm_id ON lawyers(law_firm_id);
CREATE INDEX idx_lawyers_verified ON lawyers(verified);
CREATE INDEX idx_lawyers_featured ON lawyers(featured);
CREATE INDEX idx_lawyers_name ON lawyers(first_name, last_name);

-- Lawyer service areas (many-to-many)
CREATE TABLE lawyer_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lawyer_id, city_id)
);

CREATE INDEX idx_lawyer_service_areas_lawyer_id ON lawyer_service_areas(lawyer_id);
CREATE INDEX idx_lawyer_service_areas_city_id ON lawyer_service_areas(city_id);

-- ============================================================================
-- CONTENT TABLES
-- ============================================================================

-- Blog posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID, -- Can reference auth.users if needed
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Article categories
CREATE TABLE article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_categories_slug ON article_categories(slug);
CREATE INDEX idx_article_categories_parent_id ON article_categories(parent_id);

-- Articles (educational content)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  featured_image_url TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_provider TEXT, -- youtube, vimeo, etc
  video_id TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_slug ON videos(slug);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_published_at ON videos(published_at);

-- Questions/FAQs
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  tags TEXT[],
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_slug ON questions(slug);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_status ON questions(status);

-- ============================================================================
-- PROCESS & SUPPORT CONTENT
-- ============================================================================

-- Divorce stages
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  icon_name TEXT,
  order_index INTEGER,
  estimated_duration TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stages_slug ON stages(slug);
CREATE INDEX idx_stages_order ON stages(order_index);

-- Emotional support content
CREATE TABLE emotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  coping_strategies TEXT[],
  related_resources TEXT[],
  icon_name TEXT,
  color_hex TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emotions_slug ON emotions(slug);

-- ============================================================================
-- TEAM & USERS
-- ============================================================================

-- Team members
CREATE TABLE team_members (
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

CREATE INDEX idx_team_members_slug ON team_members(slug);
CREATE INDEX idx_team_members_active ON team_members(active);

-- ============================================================================
-- TAXONOMIES
-- ============================================================================

-- Tags (general purpose tags for content)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

-- Post tags (many-to-many)
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Article tags (many-to-many)
CREATE TABLE article_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

CREATE INDEX idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- ============================================================================
-- MEDIA
-- ============================================================================

-- Media library
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  storage_url TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID, -- Can reference auth.users if needed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_wordpress_id ON media(wordpress_id);
CREATE INDEX idx_media_mime_type ON media(mime_type);

-- ============================================================================
-- LEAD/CONTACT FORMS
-- ============================================================================

-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city_id UUID REFERENCES cities(id),
  lawyer_id UUID REFERENCES lawyers(id),
  message TEXT NOT NULL,
  source TEXT, -- 'contact_form', 'lawyer_inquiry', etc.
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_lawyer_id ON contact_submissions(lawyer_id);

-- ============================================================================
-- FULL-TEXT SEARCH
-- ============================================================================

-- Add full-text search to content tables
ALTER TABLE posts ADD COLUMN search_vector tsvector;
ALTER TABLE articles ADD COLUMN search_vector tsvector;
ALTER TABLE lawyers ADD COLUMN search_vector tsvector;
ALTER TABLE law_firms ADD COLUMN search_vector tsvector;
ALTER TABLE cities ADD COLUMN search_vector tsvector;

-- Create indexes for full-text search
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);
CREATE INDEX idx_lawyers_search ON lawyers USING GIN(search_vector);
CREATE INDEX idx_law_firms_search ON law_firms USING GIN(search_vector);
CREATE INDEX idx_cities_search ON cities USING GIN(search_vector);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON law_firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emotions_updated_at BEFORE UPDATE ON emotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector trigger function
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.excerpt, ''));
  ELSIF TG_TABLE_NAME = 'articles' THEN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.excerpt, ''));
  ELSIF TG_TABLE_NAME = 'lawyers' THEN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' ' || COALESCE(NEW.bio, ''));
  ELSIF TG_TABLE_NAME = 'law_firms' THEN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  ELSIF TG_TABLE_NAME = 'cities' THEN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.content, ''));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector triggers
CREATE TRIGGER update_posts_search_vector BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_articles_search_vector BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_lawyers_search_vector BEFORE INSERT OR UPDATE ON lawyers
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_law_firms_search_vector BEFORE INSERT OR UPDATE ON law_firms
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_cities_search_vector BEFORE INSERT OR UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables (can be refined later)
CREATE POLICY "Public read access" ON states FOR SELECT USING (true);
CREATE POLICY "Public read access" ON counties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON law_firms FOR SELECT USING (true);
CREATE POLICY "Public read access" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON videos FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON questions FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON stages FOR SELECT USING (true);
CREATE POLICY "Public read access" ON emotions FOR SELECT USING (true);

-- Contact submissions: no public read access
CREATE POLICY "No public access to contact submissions" ON contact_submissions FOR SELECT USING (false);

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- This schema is designed for:
-- 1. High-performance reads (extensive indexing)
-- 2. SEO-friendly structure (slugs, meta fields)
-- 3. Full-text search capabilities
-- 4. Location-based directory (states, counties, cities)
-- 5. Lawyer/law firm directory
-- 6. Content management (blog, articles, videos, FAQs)
-- 7. Lead generation (contact forms)
-- 8. WordPress migration (wordpress_id fields for mapping)
