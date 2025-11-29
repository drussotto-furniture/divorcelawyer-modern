-- Migration: Check Location Data Counts
-- This query shows the current counts for all location tables

SELECT 
  'States' as table_name,
  COUNT(*) as current_count,
  52 as expected_count,
  CASE WHEN COUNT(*) = 52 THEN '✅ Complete' ELSE '⚠️ Missing: ' || (52 - COUNT(*))::text END as status
FROM states

UNION ALL

SELECT 
  'Counties' as table_name,
  COUNT(*) as current_count,
  3217 as expected_count,
  CASE WHEN COUNT(*) = 3217 THEN '✅ Complete' ELSE '⚠️ Missing: ' || (3217 - COUNT(*))::text END as status
FROM counties

UNION ALL

SELECT 
  'Cities' as table_name,
  COUNT(*) as current_count,
  29585 as expected_count,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✅ Sample imported (' || COUNT(*)::text || ' of ' || 29585::text || ')'
    ELSE '⚠️ Missing data'
  END as status
FROM cities

UNION ALL

SELECT 
  'Zip Codes' as table_name,
  COUNT(*) as current_count,
  40954 as expected_count,
  CASE WHEN COUNT(*) = 40954 THEN '✅ Complete' ELSE '⚠️ Missing: ' || (40954 - COUNT(*))::text END as status
FROM zip_codes

UNION ALL

SELECT 
  'Markets' as table_name,
  COUNT(*) as current_count,
  1 as expected_count,
  CASE WHEN COUNT(*) >= 1 THEN '✅ Complete' ELSE '⚠️ Missing' END as status
FROM markets

UNION ALL

SELECT 
  'Zip Codes with City Links' as table_name,
  COUNT(*) as current_count,
  0 as expected_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' linked'
    ELSE '⚠️ None linked (cities missing wordpress_id)'
  END as status
FROM zip_codes
WHERE city_id IS NOT NULL

ORDER BY table_name;

