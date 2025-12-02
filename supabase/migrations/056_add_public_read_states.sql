-- Migration: Add Public Read Access to States Table
-- The states table needs public read access for the search functionality to work

-- Add public read policy for states
DROP POLICY IF EXISTS "Public read access" ON states;
CREATE POLICY "Public read access" ON states
  FOR SELECT
  TO public
  USING (true);

