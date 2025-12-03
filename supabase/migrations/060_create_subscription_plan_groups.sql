-- Migration: Create Subscription Plan Groups
-- Allows grouping multiple DMAs together for shared pricing/feature overrides
-- A DMA can be: Global (default), in a Group, OR have an Individual Exception (exclusive)

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
-- Each DMA can only belong to ONE group (unique constraint on dma_id)
CREATE TABLE IF NOT EXISTS subscription_plan_group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES subscription_plan_groups(id) ON DELETE CASCADE,
  dma_id UUID NOT NULL REFERENCES dmas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dma_id) -- Each DMA can only be in one group
);

-- Create subscription_plan_group_overrides table
-- Stores plan-level overrides for each group (per-plan, like Premium, Enhanced, etc.)
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
CREATE POLICY "Public can read subscription plan groups" ON subscription_plan_groups
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read subscription plan group memberships" ON subscription_plan_group_memberships
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read subscription plan group overrides" ON subscription_plan_group_overrides
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read subscription plan group override features" ON subscription_plan_group_override_features
  FOR SELECT TO anon, authenticated USING (true);

-- Super admins can manage
CREATE POLICY "Super admins can manage subscription plan groups" ON subscription_plan_groups
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage subscription plan group memberships" ON subscription_plan_group_memberships
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage subscription plan group overrides" ON subscription_plan_group_overrides
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage subscription plan group override features" ON subscription_plan_group_override_features
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

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
-- Returns: 'global', 'group', or 'exception'
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

