-- ========================================
-- MIGRATION 063: Fix ALL Landscape Headshots
-- ========================================
-- Updates ALL lawyers (not just test data) that have landscape/placeholder images
-- with professional headshots

-- Professional headshot URLs from Unsplash - verified professional portraits
DO $$
DECLARE
  professional_headshots TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988bdfe0b?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988bdfe0b?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988bdfe0b?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988bdfe0b?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face'
  ];
  
  lawyer_record RECORD;
  headshot_index INTEGER;
  updated_count INTEGER := 0;
  total_to_update INTEGER;
BEGIN
  -- Find ALL lawyers with landscape/placeholder images
  -- Strategy: Update ALL picsum.photos, placeholder, and unsplash.com images without crop=face
  SELECT COUNT(*) INTO total_to_update
  FROM lawyers
  WHERE photo_url IS NOT NULL
    AND (
      -- Picsum photos (random images) - this is the main culprit
      photo_url LIKE '%picsum.photos%'
      -- Placeholder images
      OR photo_url LIKE '%placeholder%'
      OR photo_url LIKE '%via.placeholder%'
      -- ALL Unsplash images that don't have crop=face (these are likely landscapes)
      OR (photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%')
    );
  
  RAISE NOTICE 'Found % lawyers with landscape/placeholder images to update', total_to_update;
  
  -- Show sample of what we're updating (especially picsum.photos)
  RAISE NOTICE 'Sample URLs to be updated:';
  FOR lawyer_record IN 
    SELECT first_name, last_name, photo_url
    FROM lawyers
    WHERE photo_url IS NOT NULL
      AND (
        photo_url LIKE '%picsum.photos%'
        OR photo_url LIKE '%placeholder%'
        OR photo_url LIKE '%via.placeholder%'
        OR (photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%')
      )
    ORDER BY 
      CASE WHEN photo_url LIKE '%picsum.photos%' THEN 1 ELSE 2 END,
      created_at
    LIMIT 10
  LOOP
    RAISE NOTICE '  - % %: %', 
      lawyer_record.first_name,
      lawyer_record.last_name,
      LEFT(lawyer_record.photo_url, 70);
  END LOOP;
  
  -- Update each lawyer with a professional headshot
  FOR lawyer_record IN 
    SELECT id, first_name, last_name, photo_url
    FROM lawyers
    WHERE photo_url IS NOT NULL
      AND (
        photo_url LIKE '%picsum.photos%'
        OR photo_url LIKE '%placeholder%'
        OR photo_url LIKE '%via.placeholder%'
        OR (photo_url LIKE '%unsplash.com%' AND photo_url NOT LIKE '%crop=face%')
      )
    ORDER BY created_at
  LOOP
    -- Use modulo to cycle through the headshot array
    headshot_index := ((updated_count % array_length(professional_headshots, 1)) + 1);
    
    UPDATE lawyers
    SET photo_url = professional_headshots[headshot_index],
        updated_at = NOW()
    WHERE id = lawyer_record.id;
    
    updated_count := updated_count + 1;
    
    IF updated_count <= 10 THEN
      RAISE NOTICE 'Updated % % (ID: %) - Old: %', 
        lawyer_record.first_name, 
        lawyer_record.last_name, 
        lawyer_record.id,
        LEFT(lawyer_record.photo_url, 50);
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Successfully updated % lawyer headshots with professional photos', updated_count;
  
END $$;

