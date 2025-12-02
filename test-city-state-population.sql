-- ========================================
-- TEST QUERIES: Verify City/State Population
-- ========================================

-- 1. OVERALL STATISTICS
-- Total zip codes with city and state populated
SELECT 
  COUNT(*) AS total_zip_codes_with_city_state,
  COUNT(DISTINCT city_id) AS unique_cities,
  COUNT(DISTINCT state_id) AS unique_states
FROM zip_dma_city_state
WHERE city_id IS NOT NULL AND state_id IS NOT NULL;

-- 2. BREAKDOWN BY STATUS
-- Show counts for different combinations
SELECT 
  CASE 
    WHEN dma_id IS NOT NULL AND city_id IS NOT NULL AND state_id IS NOT NULL THEN 'Has DMA + City + State'
    WHEN dma_id IS NOT NULL AND (city_id IS NULL OR state_id IS NULL) THEN 'Has DMA but missing City/State'
    WHEN dma_id IS NULL AND city_id IS NOT NULL AND state_id IS NOT NULL THEN 'Has City + State but no DMA'
    WHEN dma_id IS NULL AND (city_id IS NULL OR state_id IS NULL) THEN 'Missing DMA and City/State'
  END AS status,
  COUNT(*) AS count
FROM zip_dma_city_state
GROUP BY 
  CASE 
    WHEN dma_id IS NOT NULL AND city_id IS NOT NULL AND state_id IS NOT NULL THEN 'Has DMA + City + State'
    WHEN dma_id IS NOT NULL AND (city_id IS NULL OR state_id IS NULL) THEN 'Has DMA but missing City/State'
    WHEN dma_id IS NULL AND city_id IS NOT NULL AND state_id IS NOT NULL THEN 'Has City + State but no DMA'
    WHEN dma_id IS NULL AND (city_id IS NULL OR state_id IS NULL) THEN 'Missing DMA and City/State'
  END
ORDER BY count DESC;

-- 3. SAMPLE RECORDS WITH ALL DATA
-- Show 20 sample zip codes with DMA, city, and state
SELECT 
  zip_code,
  dma_code,
  dma_name,
  city_name,
  state_name,
  state_abbreviation
FROM zip_dma_city_state
WHERE dma_id IS NOT NULL 
  AND city_id IS NOT NULL 
  AND state_id IS NOT NULL
ORDER BY zip_code
LIMIT 20;

-- 4. COUNT BY STATE
-- How many zip codes per state (with city/state populated)
SELECT 
  state_name,
  state_abbreviation,
  COUNT(*) AS zip_code_count
FROM zip_dma_city_state
WHERE state_id IS NOT NULL
GROUP BY state_name, state_abbreviation
ORDER BY zip_code_count DESC
LIMIT 20;

-- 5. COUNT BY DMA WITH CITY/STATE INFO
-- DMAs with the most zip codes that have city/state data
SELECT 
  dma_code,
  dma_name,
  COUNT(*) AS zip_codes_with_city_state
FROM zip_dma_city_state
WHERE dma_id IS NOT NULL 
  AND city_id IS NOT NULL 
  AND state_id IS NOT NULL
GROUP BY dma_code, dma_name
ORDER BY zip_codes_with_city_state DESC
LIMIT 20;

-- 6. SPECIFIC CITY EXAMPLES
-- Check a few specific cities to verify data quality
SELECT 
  zip_code,
  city_name,
  state_abbreviation,
  dma_name
FROM zip_dma_city_state
WHERE city_name IN ('New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami')
  AND city_id IS NOT NULL
ORDER BY city_name, zip_code
LIMIT 30;

-- 7. VERIFY ZIP CODE RANGES
-- Check if major metro areas are populated
SELECT 
  state_abbreviation,
  city_name,
  COUNT(*) AS zip_count,
  MIN(zip_code) AS min_zip,
  MAX(zip_code) AS max_zip
FROM zip_dma_city_state
WHERE city_id IS NOT NULL AND state_id IS NOT NULL
GROUP BY state_abbreviation, city_name
HAVING COUNT(*) >= 50
ORDER BY zip_count DESC
LIMIT 20;

-- 8. CHECK FOR NULLS IN KEY FIELDS
-- Verify no unexpected nulls in populated records
SELECT 
  COUNT(*) AS total_with_city_state,
  SUM(CASE WHEN city_name IS NULL THEN 1 ELSE 0 END) AS null_city_names,
  SUM(CASE WHEN state_name IS NULL THEN 1 ELSE 0 END) AS null_state_names,
  SUM(CASE WHEN state_abbreviation IS NULL THEN 1 ELSE 0 END) AS null_state_abbrevs
FROM zip_dma_city_state
WHERE city_id IS NOT NULL AND state_id IS NOT NULL;

-- 9. COMPARISON: DMA MAPPINGS VS CITY/STATE MAPPINGS
-- See overlap between DMA mappings and city/state mappings
SELECT 
  COUNT(DISTINCT zip_code) AS total_unique_zips,
  COUNT(DISTINCT CASE WHEN dma_id IS NOT NULL THEN zip_code END) AS zips_with_dma,
  COUNT(DISTINCT CASE WHEN city_id IS NOT NULL THEN zip_code END) AS zips_with_city_state,
  COUNT(DISTINCT CASE WHEN dma_id IS NOT NULL AND city_id IS NOT NULL THEN zip_code END) AS zips_with_both
FROM zip_dma_city_state;

-- 10. RANDOM SAMPLING
-- Get 10 random zip codes with all data to spot-check
SELECT 
  zip_code,
  dma_name,
  city_name,
  state_abbreviation
FROM zip_dma_city_state
WHERE dma_id IS NOT NULL 
  AND city_id IS NOT NULL 
  AND state_id IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;

