-- =====================================================
-- COMBINED SUBSCRIPTION ADMIN MIGRATIONS
-- Run this in your Supabase SQL Editor
-- Includes: 058, 059, 060
-- =====================================================

-- =====================================================
-- MIGRATION 058: Create Subscription Plans Admin Tables
-- =====================================================

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plans' AND tablename = 'subscription_plans') THEN
    CREATE POLICY "Public can read subscription plans" ON subscription_plans FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan features' AND tablename = 'subscription_plan_features') THEN
    CREATE POLICY "Public can read subscription plan features" ON subscription_plan_features FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- Super admins can manage plans and features
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plans' AND tablename = 'subscription_plans') THEN
    CREATE POLICY "Super admins can manage subscription plans" ON subscription_plans FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan features' AND tablename = 'subscription_plan_features') THEN
    CREATE POLICY "Super admins can manage subscription plan features" ON subscription_plan_features FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

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


-- =====================================================
-- MIGRATION 059: Create Subscription Plan DMA Overrides
-- =====================================================

-- Create subscription_plan_dma_overrides table
CREATE TABLE IF NOT EXISTS subscription_plan_dma_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  dma_id UUID NOT NULL REFERENCES dmas(id) ON DELETE CASCADE,
  
  -- Price override (NULL = use global price)
  price_cents INTEGER DEFAULT NULL,
  price_display TEXT DEFAULT NULL,
  
  -- Description override (NULL = use global description)
  description TEXT DEFAULT NULL,
  
  -- Whether this override has custom features (if false, use global features)
  has_custom_features BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each plan can only have one override per DMA
  UNIQUE(plan_id, dma_id)
);

-- Create subscription_plan_dma_override_features table
CREATE TABLE IF NOT EXISTS subscription_plan_dma_override_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  override_id UUID NOT NULL REFERENCES subscription_plan_dma_overrides(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_value TEXT DEFAULT NULL,
  is_included BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plan_dma_overrides_plan_id ON subscription_plan_dma_overrides(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_dma_overrides_dma_id ON subscription_plan_dma_overrides(dma_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_dma_overrides_composite ON subscription_plan_dma_overrides(plan_id, dma_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_dma_override_features_override_id ON subscription_plan_dma_override_features(override_id);

-- Enable RLS
ALTER TABLE subscription_plan_dma_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_dma_override_features ENABLE ROW LEVEL SECURITY;

-- Public can read overrides (for display on upgrade page)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan DMA overrides' AND tablename = 'subscription_plan_dma_overrides') THEN
    CREATE POLICY "Public can read subscription plan DMA overrides" ON subscription_plan_dma_overrides FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan DMA override features' AND tablename = 'subscription_plan_dma_override_features') THEN
    CREATE POLICY "Public can read subscription plan DMA override features" ON subscription_plan_dma_override_features FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- Super admins can manage overrides
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan DMA overrides' AND tablename = 'subscription_plan_dma_overrides') THEN
    CREATE POLICY "Super admins can manage subscription plan DMA overrides" ON subscription_plan_dma_overrides FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan DMA override features' AND tablename = 'subscription_plan_dma_override_features') THEN
    CREATE POLICY "Super admins can manage subscription plan DMA override features" ON subscription_plan_dma_override_features FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_dma_overrides_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_dma_overrides_updated_at 
    BEFORE UPDATE ON subscription_plan_dma_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_dma_override_features_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_dma_override_features_updated_at 
    BEFORE UPDATE ON subscription_plan_dma_override_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE subscription_plan_dma_overrides IS 'DMA-specific overrides for subscription plans. NULL values mean "use global setting".';
COMMENT ON TABLE subscription_plan_dma_override_features IS 'Custom features for DMA-specific plan overrides. Only used when has_custom_features = true.';


-- =====================================================
-- MIGRATION 060: Create Subscription Plan Groups
-- =====================================================

-- Create subscription_plan_groups table
CREATE TABLE IF NOT EXISTS subscription_plan_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_plan_group_memberships table
CREATE TABLE IF NOT EXISTS subscription_plan_group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES subscription_plan_groups(id) ON DELETE CASCADE,
  dma_id UUID NOT NULL REFERENCES dmas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dma_id) -- Each DMA can only be in one group
);

-- Create subscription_plan_group_overrides table
CREATE TABLE IF NOT EXISTS subscription_plan_group_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES subscription_plan_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  
  -- Price override (NULL = use global price)
  price_cents INTEGER DEFAULT NULL,
  price_display TEXT DEFAULT NULL,
  
  -- Description override (NULL = use global description)
  description TEXT DEFAULT NULL,
  
  -- Whether this override has custom features
  has_custom_features BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each plan can only have one override per group
  UNIQUE(group_id, plan_id)
);

-- Create subscription_plan_group_override_features table
CREATE TABLE IF NOT EXISTS subscription_plan_group_override_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  override_id UUID NOT NULL REFERENCES subscription_plan_group_overrides(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_value TEXT DEFAULT NULL,
  is_included BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plan_groups_name ON subscription_plan_groups(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_group_memberships_group_id ON subscription_plan_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_group_memberships_dma_id ON subscription_plan_group_memberships(dma_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_group_overrides_group_id ON subscription_plan_group_overrides(group_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_group_overrides_plan_id ON subscription_plan_group_overrides(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_group_override_features_override_id ON subscription_plan_group_override_features(override_id);

-- Enable RLS
ALTER TABLE subscription_plan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_group_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plan_group_override_features ENABLE ROW LEVEL SECURITY;

-- Public can read (for upgrade page display)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan groups' AND tablename = 'subscription_plan_groups') THEN
    CREATE POLICY "Public can read subscription plan groups" ON subscription_plan_groups FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan group memberships' AND tablename = 'subscription_plan_group_memberships') THEN
    CREATE POLICY "Public can read subscription plan group memberships" ON subscription_plan_group_memberships FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan group overrides' AND tablename = 'subscription_plan_group_overrides') THEN
    CREATE POLICY "Public can read subscription plan group overrides" ON subscription_plan_group_overrides FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read subscription plan group override features' AND tablename = 'subscription_plan_group_override_features') THEN
    CREATE POLICY "Public can read subscription plan group override features" ON subscription_plan_group_override_features FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- Super admins can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan groups' AND tablename = 'subscription_plan_groups') THEN
    CREATE POLICY "Super admins can manage subscription plan groups" ON subscription_plan_groups FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan group memberships' AND tablename = 'subscription_plan_group_memberships') THEN
    CREATE POLICY "Super admins can manage subscription plan group memberships" ON subscription_plan_group_memberships FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan group overrides' AND tablename = 'subscription_plan_group_overrides') THEN
    CREATE POLICY "Super admins can manage subscription plan group overrides" ON subscription_plan_group_overrides FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage subscription plan group override features' AND tablename = 'subscription_plan_group_override_features') THEN
    CREATE POLICY "Super admins can manage subscription plan group override features" ON subscription_plan_group_override_features FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
  END IF;
END $$;

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_groups_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_groups_updated_at 
    BEFORE UPDATE ON subscription_plan_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_group_overrides_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_group_overrides_updated_at 
    BEFORE UPDATE ON subscription_plan_group_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plan_group_override_features_updated_at') THEN
    CREATE TRIGGER update_subscription_plan_group_override_features_updated_at 
    BEFORE UPDATE ON subscription_plan_group_override_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Helper function to get DMA assignment type
CREATE OR REPLACE FUNCTION get_dma_assignment_type(p_dma_id UUID)
RETURNS TABLE (
  assignment_type TEXT,
  group_id UUID,
  group_name TEXT,
  exception_id UUID
) AS $$
BEGIN
  -- Check for individual exception first
  IF EXISTS (
    SELECT 1 FROM subscription_plan_dma_overrides 
    WHERE dma_id = p_dma_id AND is_active = true
  ) THEN
    RETURN QUERY
    SELECT 
      'exception'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      o.id
    FROM subscription_plan_dma_overrides o
    WHERE o.dma_id = p_dma_id AND o.is_active = true
    LIMIT 1;
    RETURN;
  END IF;
  
  -- Check for group membership
  IF EXISTS (
    SELECT 1 FROM subscription_plan_group_memberships m
    JOIN subscription_plan_groups g ON g.id = m.group_id
    WHERE m.dma_id = p_dma_id AND g.is_active = true
  ) THEN
    RETURN QUERY
    SELECT 
      'group'::TEXT,
      g.id,
      g.name,
      NULL::UUID
    FROM subscription_plan_group_memberships m
    JOIN subscription_plan_groups g ON g.id = m.group_id
    WHERE m.dma_id = p_dma_id AND g.is_active = true
    LIMIT 1;
    RETURN;
  END IF;
  
  -- Default to global
  RETURN QUERY
  SELECT 
    'global'::TEXT,
    NULL::UUID,
    NULL::TEXT,
    NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_effective_plan_for_dma function to check group overrides
-- Priority: Individual Exception > Group Override > Global
CREATE OR REPLACE FUNCTION get_effective_plan_for_dma(
  p_plan_name TEXT,
  p_dma_id UUID
) RETURNS jsonb AS $$
DECLARE
  global_plan RECORD;
  dma_override RECORD;
  group_override RECORD;
  group_membership RECORD;
  global_features jsonb;
  override_features jsonb;
  result jsonb;
BEGIN
  -- Get global plan
  SELECT * INTO global_plan
  FROM subscription_plans
  WHERE name = p_plan_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Get global features
  SELECT jsonb_agg(
    jsonb_build_object(
      'feature_name', feature_name,
      'feature_value', feature_value,
      'is_included', is_included,
      'is_highlighted', is_highlighted,
      'sort_order', sort_order
    ) ORDER BY sort_order
  ) INTO global_features
  FROM subscription_plan_features
  WHERE plan_id = global_plan.id;
  
  -- Check for individual DMA override first (highest priority)
  SELECT * INTO dma_override
  FROM subscription_plan_dma_overrides
  WHERE plan_id = global_plan.id 
    AND dma_id = p_dma_id 
    AND is_active = true;
  
  IF FOUND THEN
    -- Use individual DMA override
    IF dma_override.has_custom_features THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'feature_name', feature_name,
          'feature_value', feature_value,
          'is_included', is_included,
          'is_highlighted', is_highlighted,
          'sort_order', sort_order
        ) ORDER BY sort_order
      ) INTO override_features
      FROM subscription_plan_dma_override_features
      WHERE override_id = dma_override.id;
    END IF;
    
    RETURN jsonb_build_object(
      'plan_id', global_plan.id,
      'plan_name', global_plan.name,
      'display_name', global_plan.display_name,
      'price_cents', COALESCE(dma_override.price_cents, global_plan.price_cents),
      'price_display', COALESCE(dma_override.price_display, global_plan.price_display),
      'billing_period', global_plan.billing_period,
      'description', COALESCE(dma_override.description, global_plan.description),
      'is_recommended', global_plan.is_recommended,
      'has_dma_override', true,
      'override_type', 'exception',
      'price_overridden', dma_override.price_cents IS NOT NULL,
      'features_overridden', dma_override.has_custom_features,
      'features', COALESCE(override_features, global_features)
    );
  END IF;
  
  -- Check for group membership
  SELECT m.*, g.name as group_name INTO group_membership
  FROM subscription_plan_group_memberships m
  JOIN subscription_plan_groups g ON g.id = m.group_id
  WHERE m.dma_id = p_dma_id AND g.is_active = true;
  
  IF FOUND THEN
    -- Check for group override
    SELECT * INTO group_override
    FROM subscription_plan_group_overrides
    WHERE group_id = group_membership.group_id 
      AND plan_id = global_plan.id 
      AND is_active = true;
    
    IF FOUND THEN
      -- Use group override
      IF group_override.has_custom_features THEN
        SELECT jsonb_agg(
          jsonb_build_object(
            'feature_name', feature_name,
            'feature_value', feature_value,
            'is_included', is_included,
            'is_highlighted', is_highlighted,
            'sort_order', sort_order
          ) ORDER BY sort_order
        ) INTO override_features
        FROM subscription_plan_group_override_features
        WHERE override_id = group_override.id;
      END IF;
      
      RETURN jsonb_build_object(
        'plan_id', global_plan.id,
        'plan_name', global_plan.name,
        'display_name', global_plan.display_name,
        'price_cents', COALESCE(group_override.price_cents, global_plan.price_cents),
        'price_display', COALESCE(group_override.price_display, global_plan.price_display),
        'billing_period', global_plan.billing_period,
        'description', COALESCE(group_override.description, global_plan.description),
        'is_recommended', global_plan.is_recommended,
        'has_dma_override', true,
        'override_type', 'group',
        'group_id', group_membership.group_id,
        'group_name', group_membership.group_name,
        'price_overridden', group_override.price_cents IS NOT NULL,
        'features_overridden', group_override.has_custom_features,
        'features', COALESCE(override_features, global_features)
      );
    END IF;
  END IF;
  
  -- No override, use global
  RETURN jsonb_build_object(
    'plan_id', global_plan.id,
    'plan_name', global_plan.name,
    'display_name', global_plan.display_name,
    'price_cents', global_plan.price_cents,
    'price_display', global_plan.price_display,
    'billing_period', global_plan.billing_period,
    'description', global_plan.description,
    'is_recommended', global_plan.is_recommended,
    'has_dma_override', false,
    'override_type', 'global',
    'price_overridden', false,
    'features_overridden', false,
    'features', global_features
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE subscription_plan_groups IS 'Named groups for organizing DMAs with shared pricing/features';
COMMENT ON TABLE subscription_plan_group_memberships IS 'Associates DMAs with groups. Each DMA can only be in one group.';
COMMENT ON TABLE subscription_plan_group_overrides IS 'Plan-level pricing/feature overrides for groups';
COMMENT ON FUNCTION get_dma_assignment_type IS 'Returns whether a DMA uses global, group, or exception pricing';
COMMENT ON FUNCTION get_effective_plan_for_dma IS 'Returns plan details with any DMA-specific overrides applied.';

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
SELECT 'All subscription admin tables created successfully!' as status;

