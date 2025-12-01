-- ========================================
-- MIGRATION 053: Make city_id Nullable in lawyer_service_areas
-- ========================================
-- Since we've migrated to DMA-based service areas, city_id is no longer required
-- This allows service areas to be defined by DMA only

-- First, check if there's an id column (primary key) or if (lawyer_id, city_id) is the primary key
DO $$
DECLARE
  rec RECORD;
  has_id_column BOOLEAN;
  pk_constraint_name TEXT;
BEGIN
  -- Check if there's an id column
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'lawyer_service_areas'::regclass 
    AND attname = 'id'
  ) INTO has_id_column;
  
  -- If there's no id column, we need to handle the primary key differently
  -- Find the primary key constraint name
  SELECT conname INTO pk_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'lawyer_service_areas'
    AND c.contype = 'p'
  LIMIT 1;
  
  -- If primary key exists, check if city_id is part of it
  IF pk_constraint_name IS NOT NULL THEN
    -- Check if city_id is part of the primary key
    IF EXISTS (
      SELECT 1 
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_attribute a ON a.attrelid = t.oid
      WHERE t.relname = 'lawyer_service_areas'
        AND c.contype = 'p'
        AND c.conname = pk_constraint_name
        AND a.attname = 'city_id'
        AND a.attnum = ANY(c.conkey)
    ) THEN
      -- Drop the primary key constraint
      EXECUTE 'ALTER TABLE lawyer_service_areas DROP CONSTRAINT ' || pk_constraint_name;
      
      -- If there's no id column, create one
      IF NOT has_id_column THEN
        ALTER TABLE lawyer_service_areas
        ADD COLUMN id UUID DEFAULT uuid_generate_v4();
      END IF;
      
      -- Make id the primary key
      IF has_id_column OR EXISTS (
        SELECT 1 FROM pg_attribute 
        WHERE attrelid = 'lawyer_service_areas'::regclass 
        AND attname = 'id'
      ) THEN
        -- Remove any existing primary key on id first
        ALTER TABLE lawyer_service_areas
        DROP CONSTRAINT IF EXISTS lawyer_service_areas_pkey;
        
        -- Add primary key on id
        ALTER TABLE lawyer_service_areas
        ADD PRIMARY KEY (id);
      END IF;
    END IF;
  END IF;
  
  -- Drop unique constraint on (lawyer_id, city_id) if it exists
  FOR rec IN 
    SELECT conname 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'lawyer_service_areas'
      AND c.contype = 'u'
      AND c.conkey::int[] @> ARRAY(
        SELECT attnum FROM pg_attribute 
        WHERE attrelid = t.oid AND attname = 'city_id'
      )::int[]
  LOOP
    EXECUTE 'ALTER TABLE lawyer_service_areas DROP CONSTRAINT IF EXISTS ' || rec.conname;
  END LOOP;
  
  -- Also try the common constraint name (in case the above didn't catch it)
  ALTER TABLE lawyer_service_areas 
  DROP CONSTRAINT IF EXISTS lawyer_service_areas_lawyer_id_city_id_key;
END $$;

-- Make city_id nullable
ALTER TABLE lawyer_service_areas
ALTER COLUMN city_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN lawyer_service_areas.city_id IS 'City where the lawyer provides service. DEPRECATED: Use dma_id instead. This column is kept for backward compatibility but is no longer required.';

