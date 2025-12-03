-- Migration: Add indexes for autocomplete performance
-- These indexes significantly speed up the ilike prefix searches used in autocomplete

-- Index on cities.name for city autocomplete
CREATE INDEX IF NOT EXISTS idx_cities_name_pattern ON cities (name text_pattern_ops);

-- Index on zip_codes.zip_code for zip autocomplete
CREATE INDEX IF NOT EXISTS idx_zip_codes_zip_pattern ON zip_codes (zip_code text_pattern_ops);

-- Index on states.name and abbreviation for state autocomplete
CREATE INDEX IF NOT EXISTS idx_states_name_pattern ON states (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_states_abbr_pattern ON states (abbreviation text_pattern_ops);

-- Add comment explaining the indexes
COMMENT ON INDEX idx_cities_name_pattern IS 'Speeds up prefix searches on city names (ilike city%)';
COMMENT ON INDEX idx_zip_codes_zip_pattern IS 'Speeds up prefix searches on zip codes (ilike 303%)';
COMMENT ON INDEX idx_states_name_pattern IS 'Speeds up prefix searches on state names';
COMMENT ON INDEX idx_states_abbr_pattern IS 'Speeds up prefix searches on state abbreviations';

