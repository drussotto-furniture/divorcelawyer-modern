-- Migration: Seed US States
-- Populates the states table with all 50 US states plus DC
-- This is required for state-based searches to work

INSERT INTO states (name, slug, abbreviation, created_at, updated_at)
VALUES
  ('Alabama', 'alabama', 'AL', NOW(), NOW()),
  ('Alaska', 'alaska', 'AK', NOW(), NOW()),
  ('Arizona', 'arizona', 'AZ', NOW(), NOW()),
  ('Arkansas', 'arkansas', 'AR', NOW(), NOW()),
  ('California', 'california', 'CA', NOW(), NOW()),
  ('Colorado', 'colorado', 'CO', NOW(), NOW()),
  ('Connecticut', 'connecticut', 'CT', NOW(), NOW()),
  ('Delaware', 'delaware', 'DE', NOW(), NOW()),
  ('Florida', 'florida', 'FL', NOW(), NOW()),
  ('Georgia', 'georgia', 'GA', NOW(), NOW()),
  ('Hawaii', 'hawaii', 'HI', NOW(), NOW()),
  ('Idaho', 'idaho', 'ID', NOW(), NOW()),
  ('Illinois', 'illinois', 'IL', NOW(), NOW()),
  ('Indiana', 'indiana', 'IN', NOW(), NOW()),
  ('Iowa', 'iowa', 'IA', NOW(), NOW()),
  ('Kansas', 'kansas', 'KS', NOW(), NOW()),
  ('Kentucky', 'kentucky', 'KY', NOW(), NOW()),
  ('Louisiana', 'louisiana', 'LA', NOW(), NOW()),
  ('Maine', 'maine', 'ME', NOW(), NOW()),
  ('Maryland', 'maryland', 'MD', NOW(), NOW()),
  ('Massachusetts', 'massachusetts', 'MA', NOW(), NOW()),
  ('Michigan', 'michigan', 'MI', NOW(), NOW()),
  ('Minnesota', 'minnesota', 'MN', NOW(), NOW()),
  ('Mississippi', 'mississippi', 'MS', NOW(), NOW()),
  ('Missouri', 'missouri', 'MO', NOW(), NOW()),
  ('Montana', 'montana', 'MT', NOW(), NOW()),
  ('Nebraska', 'nebraska', 'NE', NOW(), NOW()),
  ('Nevada', 'nevada', 'NV', NOW(), NOW()),
  ('New Hampshire', 'new-hampshire', 'NH', NOW(), NOW()),
  ('New Jersey', 'new-jersey', 'NJ', NOW(), NOW()),
  ('New Mexico', 'new-mexico', 'NM', NOW(), NOW()),
  ('New York', 'new-york', 'NY', NOW(), NOW()),
  ('North Carolina', 'north-carolina', 'NC', NOW(), NOW()),
  ('North Dakota', 'north-dakota', 'ND', NOW(), NOW()),
  ('Ohio', 'ohio', 'OH', NOW(), NOW()),
  ('Oklahoma', 'oklahoma', 'OK', NOW(), NOW()),
  ('Oregon', 'oregon', 'OR', NOW(), NOW()),
  ('Pennsylvania', 'pennsylvania', 'PA', NOW(), NOW()),
  ('Rhode Island', 'rhode-island', 'RI', NOW(), NOW()),
  ('South Carolina', 'south-carolina', 'SC', NOW(), NOW()),
  ('South Dakota', 'south-dakota', 'SD', NOW(), NOW()),
  ('Tennessee', 'tennessee', 'TN', NOW(), NOW()),
  ('Texas', 'texas', 'TX', NOW(), NOW()),
  ('Utah', 'utah', 'UT', NOW(), NOW()),
  ('Vermont', 'vermont', 'VT', NOW(), NOW()),
  ('Virginia', 'virginia', 'VA', NOW(), NOW()),
  ('Washington', 'washington', 'WA', NOW(), NOW()),
  ('West Virginia', 'west-virginia', 'WV', NOW(), NOW()),
  ('Wisconsin', 'wisconsin', 'WI', NOW(), NOW()),
  ('Wyoming', 'wyoming', 'WY', NOW(), NOW()),
  ('District of Columbia', 'district-of-columbia', 'DC', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Verify the insert
DO $$
DECLARE
  state_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO state_count FROM states;
  RAISE NOTICE 'States table now contains % states', state_count;
END $$;

