-- Migration: Create Subscription Plan DMA Overrides
-- Allows super admins to create DMA-specific pricing and feature overrides
-- Option C: Price and features can be overridden independently

-- Create subscription_plan_dma_overrides table
-- If a field is NULL, it means "use global setting"
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
-- Only used when has_custom_features = true on the parent override
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
CREATE POLICY "Public can read subscription plan DMA overrides" ON subscription_plan_dma_overrides
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read subscription plan DMA override features" ON subscription_plan_dma_override_features
  FOR SELECT TO anon, authenticated USING (true);

-- Super admins can manage overrides
CREATE POLICY "Super admins can manage subscription plan DMA overrides" ON subscription_plan_dma_overrides
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can manage subscription plan DMA override features" ON subscription_plan_dma_override_features
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

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

-- Helper function to get effective plan for a DMA
-- Returns the plan with any DMA-specific overrides applied
CREATE OR REPLACE FUNCTION get_effective_plan_for_dma(
  p_plan_name TEXT,
  p_dma_id UUID
) RETURNS jsonb AS $$
DECLARE
  global_plan RECORD;
  dma_override RECORD;
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
  
  -- Check for DMA override
  SELECT * INTO dma_override
  FROM subscription_plan_dma_overrides
  WHERE plan_id = global_plan.id 
    AND dma_id = p_dma_id 
    AND is_active = true;
  
  -- Build result with overrides applied
  IF FOUND THEN
    -- Get override features if has_custom_features is true
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
    
    result := jsonb_build_object(
      'plan_id', global_plan.id,
      'plan_name', global_plan.name,
      'display_name', global_plan.display_name,
      'price_cents', COALESCE(dma_override.price_cents, global_plan.price_cents),
      'price_display', COALESCE(dma_override.price_display, global_plan.price_display),
      'billing_period', global_plan.billing_period,
      'description', COALESCE(dma_override.description, global_plan.description),
      'is_recommended', global_plan.is_recommended,
      'has_dma_override', true,
      'price_overridden', dma_override.price_cents IS NOT NULL,
      'features_overridden', dma_override.has_custom_features,
      'features', COALESCE(override_features, global_features)
    );
  ELSE
    -- No override, use global
    result := jsonb_build_object(
      'plan_id', global_plan.id,
      'plan_name', global_plan.name,
      'display_name', global_plan.display_name,
      'price_cents', global_plan.price_cents,
      'price_display', global_plan.price_display,
      'billing_period', global_plan.billing_period,
      'description', global_plan.description,
      'is_recommended', global_plan.is_recommended,
      'has_dma_override', false,
      'price_overridden', false,
      'features_overridden', false,
      'features', global_features
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE subscription_plan_dma_overrides IS 'DMA-specific overrides for subscription plans. NULL values mean "use global setting".';
COMMENT ON TABLE subscription_plan_dma_override_features IS 'Custom features for DMA-specific plan overrides. Only used when has_custom_features = true.';
COMMENT ON FUNCTION get_effective_plan_for_dma IS 'Returns plan details with any DMA-specific overrides applied.';

