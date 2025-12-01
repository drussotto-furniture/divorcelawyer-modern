-- ========================================
-- MIGRATION 049: Add is_test_data Flag
-- ========================================
-- Adds a boolean flag to mark test data for easy identification and deletion

-- Add is_test_data column to law_firms table
ALTER TABLE law_firms
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Add is_test_data column to lawyers table
ALTER TABLE lawyers
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_law_firms_is_test_data ON law_firms(is_test_data) WHERE is_test_data = true;
CREATE INDEX IF NOT EXISTS idx_lawyers_is_test_data ON lawyers(is_test_data) WHERE is_test_data = true;

-- Add comment for documentation
COMMENT ON COLUMN law_firms.is_test_data IS 'Flag to mark test data. Set to true for test/demo data that can be safely deleted later.';
COMMENT ON COLUMN lawyers.is_test_data IS 'Flag to mark test data. Set to true for test/demo data that can be safely deleted later.';

-- ========================================
-- Helper function to delete all test data
-- ========================================
-- Usage: SELECT * FROM delete_test_data();
CREATE OR REPLACE FUNCTION delete_test_data()
RETURNS TABLE (
  lawyers_deleted BIGINT,
  firms_deleted BIGINT
) AS $$
DECLARE
  lawyers_count BIGINT;
  firms_count BIGINT;
BEGIN
  -- Delete lawyers with is_test_data = true
  DELETE FROM lawyers WHERE is_test_data = true;
  GET DIAGNOSTICS lawyers_count = ROW_COUNT;
  
  -- Delete law firms with is_test_data = true
  -- Note: This will cascade delete related lawyers if foreign key is set to CASCADE
  DELETE FROM law_firms WHERE is_test_data = true;
  GET DIAGNOSTICS firms_count = ROW_COUNT;
  
  RETURN QUERY SELECT lawyers_count, firms_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_test_data() TO authenticated;

COMMENT ON FUNCTION delete_test_data() IS 'Deletes all lawyers and law firms marked with is_test_data = true. Returns counts of deleted records.';

