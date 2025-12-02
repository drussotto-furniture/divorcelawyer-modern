-- ========================================
-- ANALYZE DATA GAPS
-- ========================================

-- 1. How many zip codes total vs how many have city/state
SELECT 
  'Total zip codes in database' AS metric,
  COUNT(*) AS count
FROM zip_codes
UNION ALL
SELECT 
  'Zip codes with city/state' AS metric,
  COUNT(*) AS count
FROM zip_codes
WHERE city_id IS NOT NULL
UNION ALL
SELECT 
  'Zip codes with DMA mapping' AS metric,
  COUNT(DISTINCT zip_code_id) AS count
FROM zip_code_dmas
UNION ALL
SELECT 
  'Zip codes with BOTH DMA and city/state' AS metric,
  COUNT(*) AS count
FROM zip_dma_city_state
WHERE dma_id IS NOT NULL AND city_id IS NOT NULL;

-- 2. Sample zip codes that have DMA but missing city/state
SELECT 
  zc.zip_code,
  d.code AS dma_code,
  d.name AS dma_name
FROM zip_codes zc
INNER JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
INNER JOIN dmas d ON zcd.dma_id = d.id
WHERE zc.city_id IS NULL
ORDER BY zc.zip_code
LIMIT 50;

-- 3. Count missing city/state by DMA
SELECT 
  d.code AS dma_code,
  d.name AS dma_name,
  COUNT(*) AS zip_codes_missing_city_state
FROM zip_codes zc
INNER JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
INNER JOIN dmas d ON zcd.dma_id = d.id
WHERE zc.city_id IS NULL
GROUP BY d.code, d.name
ORDER BY zip_codes_missing_city_state DESC
LIMIT 20;

-- 4. Check if CSV had these zip codes (compare zip codes in CSV vs missing)
-- This helps identify if the CSV was incomplete
SELECT 
  'Zip codes in CSV (estimated from processed rows)' AS source,
  31254 AS count
UNION ALL
SELECT 
  'Zip codes with DMA mappings' AS source,
  COUNT(DISTINCT zip_code_id)::int AS count
FROM zip_code_dmas
UNION ALL
SELECT 
  'Zip codes missing city/state (have DMA)' AS source,
  COUNT(*)::int AS count
FROM zip_codes zc
INNER JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
WHERE zc.city_id IS NULL;

-- 5. Check zip code ranges - are missing ones in specific ranges?
SELECT 
  CASE 
    WHEN zip_code < '10000' THEN '00000-09999'
    WHEN zip_code < '20000' THEN '10000-19999'
    WHEN zip_code < '30000' THEN '20000-29999'
    WHEN zip_code < '40000' THEN '30000-39999'
    WHEN zip_code < '50000' THEN '40000-49999'
    WHEN zip_code < '60000' THEN '50000-59999'
    WHEN zip_code < '70000' THEN '60000-69999'
    WHEN zip_code < '80000' THEN '70000-79999'
    WHEN zip_code < '90000' THEN '80000-89999'
    ELSE '90000-99999'
  END AS zip_range,
  COUNT(*) AS missing_city_state_count
FROM zip_codes zc
INNER JOIN zip_code_dmas zcd ON zc.id = zcd.zip_code_id
WHERE zc.city_id IS NULL
GROUP BY 
  CASE 
    WHEN zip_code < '10000' THEN '00000-09999'
    WHEN zip_code < '20000' THEN '10000-19999'
    WHEN zip_code < '30000' THEN '20000-29999'
    WHEN zip_code < '40000' THEN '30000-39999'
    WHEN zip_code < '50000' THEN '40000-49999'
    WHEN zip_code < '60000' THEN '50000-59999'
    WHEN zip_code < '70000' THEN '60000-69999'
    WHEN zip_code < '80000' THEN '70000-79999'
    WHEN zip_code < '90000' THEN '80000-89999'
    ELSE '90000-99999'
  END
ORDER BY zip_range;

