-- ========================================
-- MIGRATION 052: Create Lawyer DMA Subscriptions
-- ========================================
-- Moves subscription_type from lawyer-level to DMA-level
-- A lawyer can have different subscriptions in different DMAs
-- 
-- This migration:
-- 1. Creates lawyer_dma_subscriptions table
-- 2. Migrates existing subscription_type data to DMA-level
-- 3. Keeps subscription_type on lawyers table for backward compatibility (will be deprecated)

-- Step 1: Create lawyer_dma_subscriptions table
CREATE TABLE IF NOT EXISTS lawyer_dma_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  dma_id UUID NOT NULL REFERENCES dmas(id) ON DELETE CASCADE,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lawyer_id, dma_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lawyer_dma_subscriptions_lawyer_id ON lawyer_dma_subscriptions(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_dma_subscriptions_dma_id ON lawyer_dma_subscriptions(dma_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_dma_subscriptions_subscription_type ON lawyer_dma_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_lawyer_dma_subscriptions_composite ON lawyer_dma_subscriptions(lawyer_id, dma_id, subscription_type);

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lawyer_dma_subscriptions_updated_at') THEN
    CREATE TRIGGER update_lawyer_dma_subscriptions_updated_at 
    BEFORE UPDATE ON lawyer_dma_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 2: Migrate existing subscription_type data to DMA-level
-- For each lawyer, create subscriptions for all DMAs they're associated with
DO $$
DECLARE
  lawyer_record RECORD;
  dma_record RECORD;
  service_area_record RECORD;
  zip_code_record RECORD;
  dma_id_found UUID;
BEGIN
  -- Loop through all lawyers
  FOR lawyer_record IN 
    SELECT id, subscription_type, office_zip_code
    FROM lawyers
    WHERE subscription_type IS NOT NULL
  LOOP
    -- Method 1: Get DMAs from lawyer_service_areas
    FOR service_area_record IN
      SELECT dma_id
      FROM lawyer_service_areas
      WHERE lawyer_id = lawyer_record.id
        AND dma_id IS NOT NULL
    LOOP
      -- Insert or update subscription for this lawyer-DMA pair
      INSERT INTO lawyer_dma_subscriptions (lawyer_id, dma_id, subscription_type, created_at, updated_at)
      VALUES (lawyer_record.id, service_area_record.dma_id, lawyer_record.subscription_type, NOW(), NOW())
      ON CONFLICT (lawyer_id, dma_id) 
      DO UPDATE SET 
        subscription_type = EXCLUDED.subscription_type,
        updated_at = NOW();
    END LOOP;
    
    -- Method 2: If no service areas, get DMA from office_zip_code
    IF NOT EXISTS (
      SELECT 1 FROM lawyer_dma_subscriptions WHERE lawyer_id = lawyer_record.id
    ) AND lawyer_record.office_zip_code IS NOT NULL THEN
      -- Find DMA for this zip code
      SELECT zcd.dma_id INTO dma_id_found
      FROM zip_codes zc
      JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
      WHERE zc.zip_code = lawyer_record.office_zip_code
      LIMIT 1;
      
      IF dma_id_found IS NOT NULL THEN
        INSERT INTO lawyer_dma_subscriptions (lawyer_id, dma_id, subscription_type, created_at, updated_at)
        VALUES (lawyer_record.id, dma_id_found, lawyer_record.subscription_type, NOW(), NOW())
        ON CONFLICT (lawyer_id, dma_id) 
        DO UPDATE SET 
          subscription_type = EXCLUDED.subscription_type,
          updated_at = NOW();
      END IF;
    END IF;
    
    -- Method 3: If still no DMA found, get DMA from law firm's zip code
    IF NOT EXISTS (
      SELECT 1 FROM lawyer_dma_subscriptions WHERE lawyer_id = lawyer_record.id
    ) THEN
      SELECT zcd.dma_id INTO dma_id_found
      FROM lawyers l
      JOIN law_firms lf ON l.law_firm_id = lf.id
      JOIN zip_codes zc ON lf.zip_code = zc.zip_code
      JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
      WHERE l.id = lawyer_record.id
      LIMIT 1;
      
      IF dma_id_found IS NOT NULL THEN
        INSERT INTO lawyer_dma_subscriptions (lawyer_id, dma_id, subscription_type, created_at, updated_at)
        VALUES (lawyer_record.id, dma_id_found, lawyer_record.subscription_type, NOW(), NOW())
        ON CONFLICT (lawyer_id, dma_id) 
        DO UPDATE SET 
          subscription_type = EXCLUDED.subscription_type,
          updated_at = NOW();
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: Created DMA-level subscriptions for all lawyers';
END $$;

-- Step 3: Enable RLS
ALTER TABLE lawyer_dma_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can read subscriptions
CREATE POLICY "Public can read lawyer DMA subscriptions" ON lawyer_dma_subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Super admins can manage subscriptions
CREATE POLICY "Super admins can manage lawyer DMA subscriptions" ON lawyer_dma_subscriptions
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Lawyers can read their own subscriptions
CREATE POLICY "Lawyers can read their own DMA subscriptions" ON lawyer_dma_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lawyers 
      WHERE lawyers.id = lawyer_dma_subscriptions.lawyer_id 
      AND lawyers.id::text = auth.uid()::text
    )
  );

-- Add comments
COMMENT ON TABLE lawyer_dma_subscriptions IS 'Stores subscription type for each lawyer-DMA pair. A lawyer can have different subscriptions in different DMAs.';
COMMENT ON COLUMN lawyer_dma_subscriptions.lawyer_id IS 'Reference to the lawyer';
COMMENT ON COLUMN lawyer_dma_subscriptions.dma_id IS 'Reference to the DMA where this subscription applies';
COMMENT ON COLUMN lawyer_dma_subscriptions.subscription_type IS 'Subscription type for this lawyer in this DMA';

