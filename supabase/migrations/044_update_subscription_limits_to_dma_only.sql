-- ========================================
-- MIGRATION 044: Update Subscription Limits to DMA-Only
-- ========================================
-- Changes subscription limits to only support global rules and DMA-level exceptions
-- Removes support for city and state-level overrides

-- Step 1: Delete all existing city and market (non-DMA) limits
-- These will need to be recreated as DMA limits if needed
DELETE FROM subscription_limits 
WHERE location_type IN ('city', 'market');

-- Step 2: Add check constraint to only allow 'global' or 'dma' as location_type
ALTER TABLE subscription_limits 
DROP CONSTRAINT IF EXISTS subscription_limits_location_type_check;

ALTER TABLE subscription_limits 
ADD CONSTRAINT subscription_limits_location_type_check 
CHECK (location_type IN ('global', 'dma'));

-- Step 3: Update the check_subscription_limit function to work with DMA IDs
-- The function now:
-- - Takes a DMA ID instead of city/market names
-- - Gets DMA from law firm's city via zip codes
-- - Only checks global and DMA limits (no city limits)

CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_subscription_type subscription_type,
  p_city_id UUID DEFAULT NULL,
  p_dma_id UUID DEFAULT NULL, -- Direct DMA ID (preferred)
  p_lawyer_id UUID DEFAULT NULL -- Exclude this lawyer when counting (for edits)
) RETURNS jsonb AS $$
DECLARE
  current_count_dma INTEGER := 0;
  dma_limit INTEGER;
  global_limit INTEGER;
  resolved_dma_id UUID;
  result jsonb;
BEGIN
  -- Resolve DMA ID from city if not provided directly
  -- Get DMA from city by finding a zip code in that city
  IF p_dma_id IS NULL AND p_city_id IS NOT NULL THEN
    SELECT zcd.dma_id INTO resolved_dma_id
    FROM zip_codes zc
    JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
    WHERE zc.city_id = p_city_id
    LIMIT 1; -- If city has multiple zip codes in different DMAs, take the first one
  ELSE
    resolved_dma_id := p_dma_id;
  END IF;

  -- Get current count in DMA (excluding the lawyer being edited)
  -- Use DISTINCT to avoid counting the same lawyer multiple times if city has multiple zip codes
  IF resolved_dma_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT l.id) INTO current_count_dma
    FROM lawyers l
    LEFT JOIN law_firms lf ON l.law_firm_id = lf.id
    LEFT JOIN cities c ON lf.city_id = c.id
    LEFT JOIN zip_codes zc ON zc.city_id = c.id
    LEFT JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
    WHERE zcd.dma_id = resolved_dma_id
      AND l.subscription_type = p_subscription_type
      AND (p_lawyer_id IS NULL OR l.id != p_lawyer_id);
  END IF;

  -- Get DMA limit
  IF resolved_dma_id IS NOT NULL THEN
    SELECT max_lawyers INTO dma_limit
    FROM subscription_limits
    WHERE location_type = 'dma'
      AND location_value = resolved_dma_id::TEXT
      AND subscription_type = p_subscription_type;
  END IF;

  -- Get global limit (fallback)
  SELECT max_lawyers INTO global_limit
  FROM subscription_limits
  WHERE location_type = 'global'
    AND location_value = 'default'
    AND subscription_type = p_subscription_type;

  -- Use DMA limit if exists, otherwise fall back to global
  dma_limit := COALESCE(dma_limit, global_limit);

  -- Build result
  result := jsonb_build_object(
    'dma', jsonb_build_object(
      'dma_id', COALESCE(resolved_dma_id::TEXT, 'N/A'),
      'current_count', current_count_dma,
      'limit', dma_limit,
      'is_at_limit', dma_limit IS NOT NULL AND current_count_dma >= dma_limit,
      'is_over_limit', dma_limit IS NOT NULL AND current_count_dma > dma_limit
    ),
    'global', jsonb_build_object(
      'limit', global_limit
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update comment on subscription_limits table
COMMENT ON TABLE subscription_limits IS 'Subscription limits system. Supports global defaults and DMA-level exceptions only. location_type must be ''global'' or ''dma''. For DMA type, location_value stores the DMA UUID as text.';

-- Step 5: Update comment on location_type column
COMMENT ON COLUMN subscription_limits.location_type IS 'Location type: ''global'' for default rules, ''dma'' for DMA-specific exceptions';

-- Step 6: Update comment on location_value column
COMMENT ON COLUMN subscription_limits.location_value IS 'Location value: ''default'' for global type, DMA UUID (as text) for dma type';

