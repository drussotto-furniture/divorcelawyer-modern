-- Migration: Homepage Content Management
-- Adds tables for managing homepage content that is currently hardcoded

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Homepage Content Table
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL, -- 'hero', 'discover_slider', 'real_voices', 'categories', 'connect_cta'
  key TEXT NOT NULL, -- unique identifier for each content piece
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB, -- flexible JSON for section-specific data
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, key)
);

CREATE INDEX idx_homepage_content_section ON homepage_content(section);
CREATE INDEX idx_homepage_content_active ON homepage_content(active);
CREATE INDEX idx_homepage_content_order ON homepage_content(section, order_index);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  value_json JSONB, -- for complex settings
  description TEXT,
  category TEXT, -- 'general', 'homepage', 'seo', 'defaults', etc.
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- Real Voices Stories Table
CREATE TABLE IF NOT EXISTS real_voices_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT,
  author_display_name TEXT, -- for anonymous stories (e.g., "Anonymous")
  featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_real_voices_status ON real_voices_stories(status);
CREATE INDEX idx_real_voices_featured ON real_voices_stories(featured);
CREATE INDEX idx_real_voices_order ON real_voices_stories(order_index);

-- Content Categories Table (for homepage categories section)
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_categories_slug ON content_categories(slug);
CREATE INDEX idx_content_categories_featured ON content_categories(featured);
CREATE INDEX idx_content_categories_order ON content_categories(order_index);

-- Triggers for updated_at
CREATE TRIGGER update_homepage_content_updated_at BEFORE UPDATE ON homepage_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_voices_stories_updated_at BEFORE UPDATE ON real_voices_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_voices_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access to homepage content" ON homepage_content 
  FOR SELECT USING (active = true);

CREATE POLICY "Public read access to site settings" ON site_settings 
  FOR SELECT USING (true);

CREATE POLICY "Public read access to published stories" ON real_voices_stories 
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public read access to active categories" ON content_categories 
  FOR SELECT USING (active = true);

-- Insert default site settings
INSERT INTO site_settings (key, value, description, category) VALUES
  ('default_city', 'atlanta', 'Default city for homepage', 'defaults'),
  ('default_city_display', 'Atlanta', 'Default city display name', 'defaults'),
  ('default_state_code', 'GA', 'Default state code', 'defaults'),
  ('site_name', 'DivorceLawyer.com', 'Site name', 'general'),
  ('site_tagline', 'The Best Divorce Lawyers and Expert Resources', 'Site tagline', 'general')
ON CONFLICT (key) DO NOTHING;


