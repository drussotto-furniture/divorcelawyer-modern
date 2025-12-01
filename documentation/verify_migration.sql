-- ========================================
-- Verify DMA Subscriptions Migration
-- ========================================

-- 1. Total count of subscriptions created
SELECT COUNT(*) as total_subscriptions FROM lawyer_dma_subscriptions;

-- 2. Total count of lawyers
SELECT COUNT(*) as total_lawyers FROM lawyers;

-- 3. Count of lawyers WITH subscriptions
SELECT COUNT(DISTINCT lawyer_id) as lawyers_with_subscriptions 
FROM lawyer_dma_subscriptions;

-- 4. Count of lawyers WITHOUT subscriptions
SELECT COUNT(*) as lawyers_without_subscriptions
FROM lawyers l
WHERE NOT EXISTS (
  SELECT 1 FROM lawyer_dma_subscriptions lds 
  WHERE lds.lawyer_id = l.id
);

-- 5. Lawyers without subscriptions (if any)
SELECT 
  id,
  first_name || ' ' || last_name as lawyer_name,
  subscription_type as default_subscription,
  office_zip_code,
  law_firm_id
FROM lawyers l
WHERE NOT EXISTS (
  SELECT 1 FROM lawyer_dma_subscriptions lds 
  WHERE lds.lawyer_id = l.id
)
LIMIT 20;

-- 6. Distribution: How many DMAs per lawyer?
SELECT 
  COUNT(lds.dma_id) as dma_count,
  COUNT(*) as lawyer_count
FROM (
  SELECT DISTINCT lawyer_id 
  FROM lawyer_dma_subscriptions
) sub
JOIN lawyer_dma_subscriptions lds ON sub.lawyer_id = lds.lawyer_id
GROUP BY lds.lawyer_id
ORDER BY dma_count DESC;

-- 7. Summary: Subscriptions per DMA
SELECT 
  d.name as dma_name,
  lds.subscription_type,
  COUNT(*) as lawyer_count
FROM lawyer_dma_subscriptions lds
JOIN dmas d ON d.id = lds.dma_id
GROUP BY d.name, lds.subscription_type
ORDER BY d.name, lds.subscription_type;

-- 8. All subscriptions (remove LIMIT to see all)
SELECT 
  l.first_name || ' ' || l.last_name as lawyer,
  d.name as dma,
  lds.subscription_type,
  l.office_zip_code,
  l.is_test_data
FROM lawyer_dma_subscriptions lds
JOIN lawyers l ON l.id = lds.lawyer_id
JOIN dmas d ON d.id = lds.dma_id
ORDER BY l.last_name, d.name;


