-- ========================================
-- MIGRATION 062: Update Test Lawyer Headshots
-- ========================================
-- Replaces landscape/placeholder images with professional headshots
-- for all test lawyers marked with is_test_data = true

-- Add is_test_data column if it doesn't exist (for self-contained migration)
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Ensure photo_url column exists (it should, but adding for safety)
-- Check if column exists first to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column to lawyers table';
  END IF;
END $$;

-- Professional headshot URLs from Unsplash
-- These are high-quality business portraits suitable for lawyer profiles
DO $$
DECLARE
  -- Array of professional headshot URLs from Unsplash
  -- Using specific photo IDs that are professional business portraits
  professional_headshots TEXT[] := ARRAY[
    -- Professional business portraits - diverse, high quality
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988bdfe0b?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
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
  total_test_lawyers INTEGER;
BEGIN
  -- Count total test lawyers
  -- First try by is_test_data flag, then fallback to identifying by placeholder/picsum URLs
  -- Handle case where photo_url might be NULL
  SELECT COUNT(*) INTO total_test_lawyers
  FROM lawyers
  WHERE is_test_data = true
     OR (photo_url IS NOT NULL AND (
         photo_url LIKE '%picsum.photos%'
         OR photo_url LIKE '%placeholder%'
         OR photo_url LIKE '%via.placeholder%'
     ));
  
  RAISE NOTICE 'Found % test lawyers to update', total_test_lawyers;
  
  -- Update each test lawyer with a professional headshot
  -- Use modulo to cycle through the headshot array
  -- Identify test lawyers by flag OR by placeholder/picsum URLs
  FOR lawyer_record IN 
    SELECT id, first_name, last_name, photo_url
    FROM lawyers
    WHERE is_test_data = true
       OR (photo_url IS NOT NULL AND (
           photo_url LIKE '%picsum.photos%'
           OR photo_url LIKE '%placeholder%'
           OR photo_url LIKE '%via.placeholder%'
       ))
    ORDER BY created_at
  LOOP
    -- Use row number to select headshot (cycles through array)
    headshot_index := ((updated_count % array_length(professional_headshots, 1)) + 1);
    
    UPDATE lawyers
    SET photo_url = professional_headshots[headshot_index],
        updated_at = NOW()
    WHERE id = lawyer_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE 'Updated % % (ID: %) with headshot %', 
      lawyer_record.first_name, 
      lawyer_record.last_name, 
      lawyer_record.id,
      headshot_index;
  END LOOP;
  
  RAISE NOTICE '✅ Successfully updated % test lawyer headshots with professional photos', updated_count;
  
END $$;

