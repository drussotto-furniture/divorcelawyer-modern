-- Migration: Add complete address fields to law_firms table
-- Adds street, zip_code, state fields for complete address information

ALTER TABLE law_firms
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES states(id);

-- Create index for state lookups
CREATE INDEX IF NOT EXISTS idx_law_firms_state_id ON law_firms(state_id);

-- Update existing address field: if it exists and city_id exists, try to extract zip
-- This is a one-time data migration
DO $$
DECLARE
  firm_record RECORD;
  city_state RECORD;
BEGIN
  FOR firm_record IN SELECT id, address, city_id FROM law_firms WHERE address IS NOT NULL AND city_id IS NOT NULL LOOP
    -- Get city and state info
    SELECT c.state_id, s.abbreviation INTO city_state
    FROM cities c
    JOIN states s ON c.state_id = s.id
    WHERE c.id = firm_record.city_id;
    
    IF city_state.state_id IS NOT NULL THEN
      UPDATE law_firms
      SET state_id = city_state.state_id
      WHERE id = firm_record.id;
    END IF;
  END LOOP;
END $$;


