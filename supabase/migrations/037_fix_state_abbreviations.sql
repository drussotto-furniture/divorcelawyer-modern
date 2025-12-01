-- Migration: Fix State Abbreviations
-- Corrects all state abbreviations to proper two-letter USPS codes
-- Fixes Georgia (GE -> GA) and ensures all states have correct abbreviations

-- Update all states with correct USPS abbreviations
UPDATE states SET abbreviation = 'AL' WHERE LOWER(name) = 'alabama';
UPDATE states SET abbreviation = 'AK' WHERE LOWER(name) = 'alaska';
UPDATE states SET abbreviation = 'AZ' WHERE LOWER(name) = 'arizona';
UPDATE states SET abbreviation = 'AR' WHERE LOWER(name) = 'arkansas';
UPDATE states SET abbreviation = 'CA' WHERE LOWER(name) = 'california';
UPDATE states SET abbreviation = 'CO' WHERE LOWER(name) = 'colorado';
UPDATE states SET abbreviation = 'CT' WHERE LOWER(name) = 'connecticut';
UPDATE states SET abbreviation = 'DE' WHERE LOWER(name) = 'delaware';
UPDATE states SET abbreviation = 'FL' WHERE LOWER(name) = 'florida';
UPDATE states SET abbreviation = 'GA' WHERE LOWER(name) = 'georgia' OR abbreviation = 'GE';
UPDATE states SET abbreviation = 'HI' WHERE LOWER(name) = 'hawaii';
UPDATE states SET abbreviation = 'ID' WHERE LOWER(name) = 'idaho';
UPDATE states SET abbreviation = 'IL' WHERE LOWER(name) = 'illinois';
UPDATE states SET abbreviation = 'IN' WHERE LOWER(name) = 'indiana';
UPDATE states SET abbreviation = 'IA' WHERE LOWER(name) = 'iowa';
UPDATE states SET abbreviation = 'KS' WHERE LOWER(name) = 'kansas';
UPDATE states SET abbreviation = 'KY' WHERE LOWER(name) = 'kentucky';
UPDATE states SET abbreviation = 'LA' WHERE LOWER(name) = 'louisiana';
UPDATE states SET abbreviation = 'ME' WHERE LOWER(name) = 'maine';
UPDATE states SET abbreviation = 'MD' WHERE LOWER(name) = 'maryland';
UPDATE states SET abbreviation = 'MA' WHERE LOWER(name) = 'massachusetts';
UPDATE states SET abbreviation = 'MI' WHERE LOWER(name) = 'michigan';
UPDATE states SET abbreviation = 'MN' WHERE LOWER(name) = 'minnesota';
UPDATE states SET abbreviation = 'MS' WHERE LOWER(name) = 'mississippi';
UPDATE states SET abbreviation = 'MO' WHERE LOWER(name) = 'missouri';
UPDATE states SET abbreviation = 'MT' WHERE LOWER(name) = 'montana';
UPDATE states SET abbreviation = 'NE' WHERE LOWER(name) = 'nebraska';
UPDATE states SET abbreviation = 'NV' WHERE LOWER(name) = 'nevada';
UPDATE states SET abbreviation = 'NH' WHERE LOWER(name) = 'new hampshire';
UPDATE states SET abbreviation = 'NJ' WHERE LOWER(name) = 'new jersey';
UPDATE states SET abbreviation = 'NM' WHERE LOWER(name) = 'new mexico';
UPDATE states SET abbreviation = 'NY' WHERE LOWER(name) = 'new york';
UPDATE states SET abbreviation = 'NC' WHERE LOWER(name) = 'north carolina';
UPDATE states SET abbreviation = 'ND' WHERE LOWER(name) = 'north dakota';
UPDATE states SET abbreviation = 'OH' WHERE LOWER(name) = 'ohio';
UPDATE states SET abbreviation = 'OK' WHERE LOWER(name) = 'oklahoma';
UPDATE states SET abbreviation = 'OR' WHERE LOWER(name) = 'oregon';
UPDATE states SET abbreviation = 'PA' WHERE LOWER(name) = 'pennsylvania';
UPDATE states SET abbreviation = 'RI' WHERE LOWER(name) = 'rhode island';
UPDATE states SET abbreviation = 'SC' WHERE LOWER(name) = 'south carolina';
UPDATE states SET abbreviation = 'SD' WHERE LOWER(name) = 'south dakota';
UPDATE states SET abbreviation = 'TN' WHERE LOWER(name) = 'tennessee';
UPDATE states SET abbreviation = 'TX' WHERE LOWER(name) = 'texas';
UPDATE states SET abbreviation = 'UT' WHERE LOWER(name) = 'utah';
UPDATE states SET abbreviation = 'VT' WHERE LOWER(name) = 'vermont';
UPDATE states SET abbreviation = 'VA' WHERE LOWER(name) = 'virginia';
UPDATE states SET abbreviation = 'WA' WHERE LOWER(name) = 'washington';
UPDATE states SET abbreviation = 'WV' WHERE LOWER(name) = 'west virginia';
UPDATE states SET abbreviation = 'WI' WHERE LOWER(name) = 'wisconsin';
UPDATE states SET abbreviation = 'WY' WHERE LOWER(name) = 'wyoming';
UPDATE states SET abbreviation = 'DC' WHERE LOWER(name) = 'district of columbia' OR LOWER(name) = 'washington dc';

-- Also fix by abbreviation directly (in case name doesn't match)
UPDATE states SET abbreviation = 'GA' WHERE abbreviation = 'GE';

-- Log the changes
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM states
  WHERE abbreviation IN (
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  );
  
  RAISE NOTICE 'State abbreviations updated. % states now have correct abbreviations.', fixed_count;
END $$;



