-- Migration: Link existing lawyers to law firms based on matching data
-- This attempts to match lawyers to firms based on name similarity or other criteria

-- First, try to match lawyers to firms by checking if lawyer's firm name matches a law firm name
-- This is a best-effort matching - manual review may be needed

DO $$
DECLARE
  lawyer_record RECORD;
  firm_record RECORD;
  matched_count INTEGER := 0;
BEGIN
  -- For lawyers that don't have a law_firm_id but might have firm information
  FOR lawyer_record IN 
    SELECT l.id, l.first_name, l.last_name, lf.name as firm_name
    FROM lawyers l
    LEFT JOIN law_firms lf ON l.law_firm_id = lf.id
    WHERE l.law_firm_id IS NULL
  LOOP
    -- Try to find a matching firm by name (case-insensitive partial match)
    -- This is a simple matching strategy - you may want to refine this
    SELECT id INTO firm_record
    FROM law_firms
    WHERE LOWER(name) LIKE '%' || LOWER(COALESCE(lawyer_record.firm_name, '')) || '%'
       OR LOWER(COALESCE(lawyer_record.firm_name, '')) LIKE '%' || LOWER(name) || '%'
    LIMIT 1;
    
    -- If we found a match, update the lawyer
    IF firm_record.id IS NOT NULL THEN
      UPDATE lawyers
      SET law_firm_id = firm_record.id
      WHERE id = lawyer_record.id;
      
      matched_count := matched_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Matched % lawyers to law firms', matched_count;
END $$;

-- Also, for lawyers that already have law_firm_id, populate their address from the firm
UPDATE lawyers l
SET 
  office_street_address = lf.street_address,
  office_address_line_2 = lf.address_line_2,
  office_city_id = lf.city_id,
  office_state_id = lf.state_id,
  office_zip_code = lf.zip_code
FROM law_firms lf
WHERE l.law_firm_id = lf.id
  AND lf.street_address IS NOT NULL
  AND (l.office_street_address IS NULL OR l.office_street_address = '');


