-- ========================================
-- MIGRATION 045: Create DMA Zip Code Counts Function
-- ========================================
-- Creates a function to efficiently count zip codes per DMA
-- This avoids the 1000 row limit issue when fetching all zip_code_dmas records

CREATE OR REPLACE FUNCTION get_dma_zip_code_counts()
RETURNS TABLE (
  dma_id UUID,
  zip_code_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    zcd.dma_id,
    COUNT(*)::BIGINT as zip_code_count
  FROM zip_code_dmas zcd
  GROUP BY zcd.dma_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dma_zip_code_counts() TO authenticated;

COMMENT ON FUNCTION get_dma_zip_code_counts() IS 'Returns the count of zip codes for each DMA. More efficient than fetching all records and counting client-side.';



