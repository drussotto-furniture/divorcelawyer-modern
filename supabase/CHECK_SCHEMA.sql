-- Quick script to check what columns exist in the lawyers table
-- Run this in Supabase SQL Editor to see the current schema

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'lawyers' 
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lawyers'
) AS lawyers_table_exists;

