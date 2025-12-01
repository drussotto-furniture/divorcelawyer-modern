-- Migration: Create Fallback Lawyers System
-- Allows admins to select which lawyers to show when location cannot be detected
-- or when there are no lawyers in a detected location

-- Create fallback_lawyers table
CREATE TABLE IF NOT EXISTS fallback_lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lawyer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fallback_lawyers_lawyer_id ON fallback_lawyers(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_fallback_lawyers_active ON fallback_lawyers(active);
CREATE INDEX IF NOT EXISTS idx_fallback_lawyers_display_order ON fallback_lawyers(display_order);

-- Enable RLS
ALTER TABLE fallback_lawyers ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see fallback lawyers)
CREATE POLICY "Public can read fallback lawyers" ON fallback_lawyers
  FOR SELECT
  USING (active = true);

-- Super admins can manage fallback lawyers
CREATE POLICY "Super admins can manage fallback lawyers" ON fallback_lawyers
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fallback_lawyers_updated_at') THEN
    CREATE TRIGGER update_fallback_lawyers_updated_at BEFORE UPDATE ON fallback_lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


