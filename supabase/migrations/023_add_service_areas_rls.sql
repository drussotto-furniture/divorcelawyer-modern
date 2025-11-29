-- Migration: Add RLS policies for lawyer_service_areas table
-- This ensures admins can read and manage service areas

-- Enable RLS on lawyer_service_areas if not already enabled
ALTER TABLE lawyer_service_areas ENABLE ROW LEVEL SECURITY;

-- Note: This migration assumes is_super_admin() function exists (created in migration 014)
-- If it doesn't exist, the policies will use the EXISTS check instead

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can read all service areas" ON lawyer_service_areas;
DROP POLICY IF EXISTS "Super admins can manage service areas" ON lawyer_service_areas;
DROP POLICY IF EXISTS "Lawyers can read own service areas" ON lawyer_service_areas;
DROP POLICY IF EXISTS "Lawyers can manage own service areas" ON lawyer_service_areas;

-- Super admins can read all service areas
CREATE POLICY "Super admins can read all service areas" ON lawyer_service_areas
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admins can manage (insert/update/delete) all service areas
CREATE POLICY "Super admins can manage service areas" ON lawyer_service_areas
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Lawyers can read their own service areas
CREATE POLICY "Lawyers can read own service areas" ON lawyer_service_areas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'lawyer' AND EXISTS (
          SELECT 1 FROM lawyers
          WHERE lawyers.id = lawyer_service_areas.lawyer_id
          AND lawyers.id = (SELECT lawyer_id FROM profiles WHERE profiles.id = auth.uid() LIMIT 1)
        )
      )
    )
  );

-- Lawyers can manage their own service areas
CREATE POLICY "Lawyers can manage own service areas" ON lawyer_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'lawyer' AND EXISTS (
          SELECT 1 FROM lawyers
          WHERE lawyers.id = lawyer_service_areas.lawyer_id
          AND lawyers.id = (SELECT lawyer_id FROM profiles WHERE profiles.id = auth.uid() LIMIT 1)
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'lawyer' AND EXISTS (
          SELECT 1 FROM lawyers
          WHERE lawyers.id = lawyer_service_areas.lawyer_id
          AND lawyers.id = (SELECT lawyer_id FROM profiles WHERE profiles.id = auth.uid() LIMIT 1)
        )
      )
    )
  );

