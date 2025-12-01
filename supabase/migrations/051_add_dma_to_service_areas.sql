-- ========================================
-- MIGRATION 051: Add DMA Support to Service Areas
-- ========================================
-- Changes lawyer_service_areas to use DMAs instead of cities
-- Adds dma_id column and migrates existing data

-- Add dma_id column to lawyer_service_areas
ALTER TABLE lawyer_service_areas
ADD COLUMN IF NOT EXISTS dma_id UUID REFERENCES dmas(id) ON DELETE CASCADE;

-- Create index for dma_id
CREATE INDEX IF NOT EXISTS idx_lawyer_service_areas_dma_id ON lawyer_service_areas(dma_id);

-- Migrate existing service areas from cities to DMAs
-- This finds the DMA for each city's zip codes and assigns it to the service area
DO $$
DECLARE
  service_area_record RECORD;
  dma_id_found UUID;
  city_zip_codes TEXT[];
BEGIN
  -- For each service area with a city_id but no dma_id
  -- Use lawyer_id and city_id to identify rows (since id column may not exist)
  FOR service_area_record IN 
    SELECT lsa.lawyer_id, lsa.city_id, lsa.dma_id
    FROM lawyer_service_areas lsa
    WHERE lsa.city_id IS NOT NULL AND (lsa.dma_id IS NULL OR lsa.dma_id = '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    -- Get zip codes for this city
    SELECT ARRAY_AGG(zc.zip_code) INTO city_zip_codes
    FROM zip_codes zc
    WHERE zc.city_id = service_area_record.city_id
    LIMIT 10; -- Use first 10 zip codes to find DMA
    
    -- Find DMA for any of these zip codes
    IF city_zip_codes IS NOT NULL AND array_length(city_zip_codes, 1) > 0 THEN
      SELECT DISTINCT zcd.dma_id INTO dma_id_found
      FROM zip_code_dmas zcd
      JOIN zip_codes zc ON zc.id = zcd.zip_code_id
      WHERE zc.zip_code = ANY(city_zip_codes)
      LIMIT 1;
      
      -- Update service area with DMA using composite key
      IF dma_id_found IS NOT NULL THEN
        UPDATE lawyer_service_areas
        SET dma_id = dma_id_found
        WHERE lawyer_id = service_area_record.lawyer_id 
          AND city_id = service_area_record.city_id
          AND (dma_id IS NULL OR dma_id = '00000000-0000-0000-0000-000000000000'::uuid);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Note: We cannot make city_id nullable if it's part of a primary key or unique constraint
-- So we'll keep city_id as NOT NULL and add dma_id as an optional field
-- Both can coexist during the transition period

-- Create unique constraint for DMA (one DMA per lawyer)
-- This allows lawyers to have service areas defined by DMA instead of city
CREATE UNIQUE INDEX IF NOT EXISTS lawyer_service_areas_lawyer_id_dma_id_key 
  ON lawyer_service_areas(lawyer_id, dma_id) 
  WHERE dma_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN lawyer_service_areas.dma_id IS 'DMA (Designated Marketing Area) where the lawyer provides service. Can be used instead of or alongside city_id for service area mapping.';
COMMENT ON COLUMN lawyer_service_areas.city_id IS 'City where the lawyer provides service. Will be phased out in favor of dma_id in a future migration once all data is migrated.';

