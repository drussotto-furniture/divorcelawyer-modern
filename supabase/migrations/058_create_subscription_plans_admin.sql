-- Migration: Create Subscription Plans Admin Tables
-- Allows super admins to manage subscription plan details and features

-- Create subscription_plans table for storing plan details
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'free', 'basic', 'enhanced', 'premium'
  display_name TEXT NOT NULL, -- 'Free', 'Basic', 'Enhanced', 'Premium'
  price_cents INTEGER NOT NULL DEFAULT 0, -- Price in cents (e.g., 149000 = $1,490)
  price_display TEXT NOT NULL DEFAULT '$0', -- Display price (e.g., '$1,490')
  billing_period TEXT NOT NULL DEFAULT 'month', -- 'month', 'year'
  description TEXT, -- Short description
  is_recommended BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_plan_features table
CREATE TABLE IF NOT EXISTS subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_value TEXT, -- NULL = included (checkmark), 'false' = not included (X), or a specific value like '3'
  is_included BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false, -- For emphasizing key features
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_features_plan_id ON subscription_plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_features_sort_order ON subscription_plan_features(sort_order);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_features ENABLE ROW LEVEL SECURITY;

-- Public can read plans and features (for display)
CREATE POLICY "Public can read subscription plans" ON subscription_plans
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read subscription plan features" ON subscription_plan_features
  FOR SELECT TO anon, authenticated USING (true);

-- Super admins can manage plans and features
CREATE POLICY "Super admins can manage subscription plans" ON subscription_plans
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage subscription plan features" ON subscription_plan_features
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_updated_at') THEN
    CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_features_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_features_updated_at 
    BEFORE UPDATE ON subscription_plan_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Seed initial plan data
INSERT INTO subscription_plans (name, display_name, price_cents, price_display, billing_period, description, is_recommended, sort_order)
VALUES
  ('premium', 'Premium', 149000, '$1,490', 'month', 'Maximum visibility and premium features for top-tier law practices', true, 1),
  ('enhanced', 'Enhanced', 99000, '$990', 'month', 'Enhanced visibility with professional features for growing practices', false, 2),
  ('basic', 'Basic', 24000, '$240', 'month', 'Essential listing to establish your online presence', false, 3),
  ('free', 'Free', 0, '$0', 'month', 'Basic directory presence', false, 4)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  description = EXCLUDED.description,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order;

-- Seed Premium features
INSERT INTO subscription_plan_features (plan_id, feature_name, feature_value, is_included, is_highlighted, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.is_highlighted, f.sort_order
FROM subscription_plans p
CROSS JOIN (VALUES
  ('Featured placement in search', NULL, true, true, 1),
  ('Law Firm & Lawyer Profiles', NULL, true, false, 2),
  ('Welcome Video', NULL, true, false, 3),
  ('Podcasts (Apple & Spotify)', '3', true, false, 4),
  ('SEO Optimization', NULL, true, false, 5),
  ('Dedicated Client Rep', NULL, true, false, 6),
  ('Profile Articles & Videos', NULL, true, false, 7),
  ('Custom Phone Number', NULL, true, false, 8),
  ('Press Release', NULL, true, false, 9),
  ('Digital Badge', NULL, true, false, 10),
  ('Back Links', NULL, true, false, 11),
  ('Link to Website', NULL, true, false, 12)
) AS f(feature_name, feature_value, is_included, is_highlighted, sort_order)
WHERE p.name = 'premium'
ON CONFLICT DO NOTHING;

-- Seed Enhanced features
INSERT INTO subscription_plan_features (plan_id, feature_name, feature_value, is_included, is_highlighted, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.is_highlighted, f.sort_order
FROM subscription_plans p
CROSS JOIN (VALUES
  ('Semi-featured placement', NULL, true, true, 1),
  ('Law Firm & Lawyer Profiles', NULL, true, false, 2),
  ('Welcome Video', NULL, true, false, 3),
  ('Podcasts (Apple & Spotify)', '2', true, false, 4),
  ('SEO Optimization', NULL, true, false, 5),
  ('Dedicated Client Rep', NULL, true, false, 6),
  ('Profile Articles & Videos', NULL, true, false, 7),
  ('Custom Phone Number', NULL, false, false, 8),
  ('Press Release', NULL, true, false, 9),
  ('Digital Badge', NULL, true, false, 10),
  ('Back Links', NULL, true, false, 11),
  ('Link to Website', NULL, true, false, 12)
) AS f(feature_name, feature_value, is_included, is_highlighted, sort_order)
WHERE p.name = 'enhanced'
ON CONFLICT DO NOTHING;

-- Seed Basic features
INSERT INTO subscription_plan_features (plan_id, feature_name, feature_value, is_included, is_highlighted, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.is_highlighted, f.sort_order
FROM subscription_plans p
CROSS JOIN (VALUES
  ('Standard listing', NULL, true, true, 1),
  ('Geo-fenced Territory', NULL, true, false, 2),
  ('Digital Badge', NULL, true, false, 3),
  ('Back Links', NULL, true, false, 4),
  ('Link to Website', NULL, true, false, 5),
  ('Lawyer Profile', NULL, false, false, 6),
  ('Videos & Podcasts', NULL, false, false, 7),
  ('SEO Optimization', NULL, false, false, 8)
) AS f(feature_name, feature_value, is_included, is_highlighted, sort_order)
WHERE p.name = 'basic'
ON CONFLICT DO NOTHING;

-- Seed Free features
INSERT INTO subscription_plan_features (plan_id, feature_name, feature_value, is_included, is_highlighted, sort_order)
SELECT p.id, f.feature_name, f.feature_value, f.is_included, f.is_highlighted, f.sort_order
FROM subscription_plans p
CROSS JOIN (VALUES
  ('Basic listing only', NULL, true, false, 1),
  ('No priority placement', NULL, false, false, 2),
  ('No profile page', NULL, false, false, 3),
  ('No featured content', NULL, false, false, 4),
  ('No SEO benefits', NULL, false, false, 5)
) AS f(feature_name, feature_value, is_included, is_highlighted, sort_order)
WHERE p.name = 'free'
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Stores subscription plan details (name, price, description) managed by super admins';
COMMENT ON TABLE subscription_plan_features IS 'Stores features for each subscription plan';

