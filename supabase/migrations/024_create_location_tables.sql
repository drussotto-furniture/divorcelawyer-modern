-- Migration: Create location tables (states, counties, cities, zip_codes, markets)
-- These tables are referenced in the schema but may not exist in the database

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- States table
CREATE TABLE IF NOT EXISTS states (
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

CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);
CREATE INDEX IF NOT EXISTS idx_states_abbreviation ON states(abbreviation);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_states_updated_at ON states;
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Counties table
CREATE TABLE IF NOT EXISTS counties (
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

CREATE INDEX IF NOT EXISTS idx_counties_slug ON counties(slug);
CREATE INDEX IF NOT EXISTS idx_counties_state_id ON counties(state_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_counties_updated_at ON counties;
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
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

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_county_id ON cities(county_id);
CREATE INDEX IF NOT EXISTS idx_cities_coordinates ON cities(latitude, longitude);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Zip codes table
CREATE TABLE IF NOT EXISTS zip_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_codes_zip ON zip_codes(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city_id ON zip_codes(city_id);

-- Markets table (geographic market areas)
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all location tables
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for super admins
-- States
DROP POLICY IF EXISTS "Super admins can read all states" ON states;
DROP POLICY IF EXISTS "Super admins can manage states" ON states;
CREATE POLICY "Super admins can read all states" ON states
  FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can manage states" ON states
  FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Counties
DROP POLICY IF EXISTS "Super admins can read all counties" ON counties;
DROP POLICY IF EXISTS "Super admins can manage counties" ON counties;
CREATE POLICY "Super admins can read all counties" ON counties
  FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can manage counties" ON counties
  FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Cities
DROP POLICY IF EXISTS "Super admins can read all cities" ON cities;
DROP POLICY IF EXISTS "Super admins can manage cities" ON cities;
CREATE POLICY "Super admins can read all cities" ON cities
  FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can manage cities" ON cities
  FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Zip codes
DROP POLICY IF EXISTS "Super admins can read all zip codes" ON zip_codes;
DROP POLICY IF EXISTS "Super admins can manage zip codes" ON zip_codes;
CREATE POLICY "Super admins can read all zip codes" ON zip_codes
  FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can manage zip codes" ON zip_codes
  FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Markets
DROP POLICY IF EXISTS "Super admins can read all markets" ON markets;
DROP POLICY IF EXISTS "Super admins can manage markets" ON markets;
CREATE POLICY "Super admins can read all markets" ON markets
  FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "Super admins can manage markets" ON markets
  FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

