-- Add missing columns and tables to Supabase

-- Add published_at column to videos table if it doesn't exist
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

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

CREATE INDEX IF NOT EXISTS idx_team_members_slug ON team_members(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

