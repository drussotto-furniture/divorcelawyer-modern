-- Migration: Add complete address fields to lawyers table
-- Adds address fields that can auto-populate from law firm but remain editable

ALTER TABLE lawyers
ADD COLUMN IF NOT EXISTS office_street_address TEXT,
ADD COLUMN IF NOT EXISTS office_address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS office_city_id UUID REFERENCES cities(id),
ADD COLUMN IF NOT EXISTS office_state_id UUID REFERENCES states(id),
ADD COLUMN IF NOT EXISTS office_zip_code TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lawyers_office_city_id ON lawyers(office_city_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_office_state_id ON lawyers(office_state_id);

-- Copy existing office_address to office_street_address if office_address exists
UPDATE lawyers
SET office_street_address = office_address
WHERE office_address IS NOT NULL AND office_street_address IS NULL;


