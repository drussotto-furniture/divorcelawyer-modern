-- ========================================
-- MIGRATION 054: Create Zip-DMA-City-State View
-- ========================================
-- Creates a view that maps zip codes to DMA, city name, and state name
-- This provides a denormalized intersection table for easy querying

-- Drop view if it exists
DROP VIEW IF EXISTS zip_dma_city_state CASCADE;

-- Create view that joins zip codes with DMA, city, and state information
CREATE VIEW zip_dma_city_state AS
SELECT 
  zc.id AS zip_code_id,
  zc.zip_code,
  d.id AS dma_id,
  d.code AS dma_code,
  d.name AS dma_name,
  d.slug AS dma_slug,
  c.id AS city_id,
  c.name AS city_name,
  c.slug AS city_slug,
  s.id AS state_id,
  s.name AS state_name,
  s.abbreviation AS state_abbreviation,
  s.slug AS state_slug,
  zcd.created_at AS mapping_created_at
FROM 
  zip_codes zc
  LEFT JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
  LEFT JOIN dmas d ON zcd.dma_id = d.id
  LEFT JOIN cities c ON zc.city_id = c.id
  LEFT JOIN states s ON c.state_id = s.id;

-- Add comment for documentation
COMMENT ON VIEW zip_dma_city_state IS 'Intersection view mapping zip codes to DMA, city name, and state name. Includes all zip codes, even if they are not mapped to a DMA or city.';

-- Create indexes on the underlying tables if they don't exist (for view performance)
-- These should already exist, but ensuring they're there
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip ON zip_codes(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_codes_city_id ON zip_codes(city_id);
CREATE INDEX IF NOT EXISTS idx_zip_code_dmas_zip_code_id ON zip_code_dmas(zip_code_id);
CREATE INDEX IF NOT EXISTS idx_zip_code_dmas_dma_id ON zip_code_dmas(dma_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);

