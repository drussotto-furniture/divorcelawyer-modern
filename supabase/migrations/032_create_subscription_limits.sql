-- Migration: Create Subscription Limits System
-- Controls maximum number of lawyers per subscription type by location (city/market)

-- Create subscription_limits table
CREATE TABLE IF NOT EXISTS subscription_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_type TEXT NOT NULL, -- 'global', 'city', or 'market' (DMA)
  location_value TEXT NOT NULL, -- e.g., 'Atlanta, GA' for city, 'Atlanta' for market, 'default' for global
  subscription_type subscription_type NOT NULL,
  max_lawyers INTEGER DEFAULT NULL, -- NULL means unlimited
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_type, location_value, subscription_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_limits_location ON subscription_limits(location_type, location_value);
CREATE INDEX IF NOT EXISTS idx_subscription_limits_subscription_type ON subscription_limits(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_limits_composite ON subscription_limits(location_type, location_value, subscription_type);

-- Insert default global limits
-- Premium = 3, Enhanced = 8, Basic = unlimited (NULL), Free = unlimited (NULL)
INSERT INTO subscription_limits (location_type, location_value, subscription_type, max_lawyers)
VALUES
  ('global', 'default', 'premium', 3),
  ('global', 'default', 'enhanced', 8),
  ('global', 'default', 'basic', NULL), -- unlimited
  ('global', 'default', 'free', NULL) -- unlimited
ON CONFLICT (location_type, location_value, subscription_type) DO NOTHING;

-- Enable RLS
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;

-- Public can read subscription limits (for frontend display)
CREATE POLICY "Public can read subscription limits" ON subscription_limits
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Super admins can manage subscription limits
CREATE POLICY "Super admins can manage subscription limits" ON subscription_limits
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_limits_updated_at') THEN
    CREATE TRIGGER update_subscription_limits_updated_at BEFORE UPDATE ON subscription_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to check subscription limit for a location
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_subscription_type subscription_type,
  p_city_id UUID DEFAULT NULL,
  p_city_name TEXT DEFAULT NULL,
  p_state_abbreviation TEXT DEFAULT NULL,
  p_market_name TEXT DEFAULT NULL,
  p_lawyer_id UUID DEFAULT NULL -- Exclude this lawyer when counting (for edits)
) RETURNS jsonb AS $$
DECLARE
  city_location TEXT;
  current_count_city INTEGER := 0;
  current_count_market INTEGER := 0;
  city_limit INTEGER;
  market_limit INTEGER;
  global_limit INTEGER;
  result jsonb;
BEGIN
  -- Build city location string if we have city and state
  IF p_city_name IS NOT NULL AND p_state_abbreviation IS NOT NULL THEN
    city_location := p_city_name || ', ' || p_state_abbreviation;
  END IF;

  -- Get current count in city (excluding the lawyer being edited)
  IF p_city_id IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count_city
    FROM lawyers l
    LEFT JOIN law_firms lf ON l.law_firm_id = lf.id
    WHERE lf.city_id = p_city_id
      AND l.subscription_type = p_subscription_type
      AND (p_lawyer_id IS NULL OR l.id != p_lawyer_id);
  END IF;

  -- Get current count in market/DMA (excluding the lawyer being edited)
  IF p_market_name IS NOT NULL THEN
    -- Note: This assumes law_firms have a market/DMA field or we can derive it from city
    -- For now, we'll count by city's market if available
    SELECT COUNT(*) INTO current_count_market
    FROM lawyers l
    LEFT JOIN law_firms lf ON l.law_firm_id = lf.id
    LEFT JOIN cities c ON lf.city_id = c.id
    WHERE c.name = p_market_name
      AND l.subscription_type = p_subscription_type
      AND (p_lawyer_id IS NULL OR l.id != p_lawyer_id);
  END IF;

  -- Get city limit
  IF city_location IS NOT NULL THEN
    SELECT max_lawyers INTO city_limit
    FROM subscription_limits
    WHERE location_type = 'city'
      AND location_value = city_location
      AND subscription_type = p_subscription_type;
  END IF;

  -- Get market limit
  IF p_market_name IS NOT NULL THEN
    SELECT max_lawyers INTO market_limit
    FROM subscription_limits
    WHERE location_type = 'market'
      AND location_value = p_market_name
      AND subscription_type = p_subscription_type;
  END IF;

  -- Get global limit (fallback)
  SELECT max_lawyers INTO global_limit
  FROM subscription_limits
  WHERE location_type = 'global'
    AND location_value = 'default'
    AND subscription_type = p_subscription_type;

  -- Use most restrictive limit (city > market > global)
  city_limit := COALESCE(city_limit, global_limit);
  market_limit := COALESCE(market_limit, global_limit);

  -- Build result
  result := jsonb_build_object(
    'city', jsonb_build_object(
      'location', COALESCE(city_location, 'N/A'),
      'current_count', current_count_city,
      'limit', city_limit,
      'is_at_limit', city_limit IS NOT NULL AND current_count_city >= city_limit,
      'is_over_limit', city_limit IS NOT NULL AND current_count_city > city_limit
    ),
    'market', jsonb_build_object(
      'location', COALESCE(p_market_name, 'N/A'),
      'current_count', current_count_market,
      'limit', market_limit,
      'is_at_limit', market_limit IS NOT NULL AND current_count_market >= market_limit,
      'is_over_limit', market_limit IS NOT NULL AND current_count_market > market_limit
    ),
    'global', jsonb_build_object(
      'limit', global_limit
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


