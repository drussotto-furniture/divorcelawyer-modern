-- ========================================
-- DIAGNOSTIC: Check Photo URLs in Database
-- ========================================
-- Run this to see what photo URLs are actually in the database
-- This will help identify why landscapes are still showing

SELECT 
  first_name,
  last_name,
  photo_url,
  CASE 
    WHEN photo_url LIKE '%picsum.photos%' THEN 'PICSUM'
    WHEN photo_url LIKE '%placeholder%' THEN 'PLACEHOLDER'
    WHEN photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%' THEN 'UNSPLASH_NO_FACE'
    WHEN photo_url LIKE '%unsplash.com%' AND photo_url LIKE '%crop=face%' THEN 'UNSPLASH_FACE'
    ELSE 'OTHER'
  END as url_type,
  is_test_data
FROM lawyers
WHERE photo_url IS NOT NULL
ORDER BY 
  CASE 
    WHEN photo_url LIKE '%picsum.photos%' THEN 1
    WHEN photo_url LIKE '%placeholder%' THEN 2
    WHEN photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%' THEN 3
    ELSE 4
  END,
  created_at
LIMIT 50;

-- Summary counts
SELECT 
  COUNT(*) as total_lawyers,
  COUNT(CASE WHEN photo_url LIKE '%picsum.photos%' THEN 1 END) as picsum_count,
  COUNT(CASE WHEN photo_url LIKE '%placeholder%' THEN 1 END) as placeholder_count,
  COUNT(CASE WHEN photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%' THEN 1 END) as unsplash_no_face_count,
  COUNT(CASE WHEN photo_url LIKE '%unsplash.com%' AND photo_url LIKE '%crop=face%' THEN 1 END) as unsplash_face_count,
  COUNT(CASE WHEN photo_url IS NULL THEN 1 END) as null_count
FROM lawyers;

