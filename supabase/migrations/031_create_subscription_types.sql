-- Migration: Create Subscription Types System
-- Defines subscription types: free, basic, enhanced, premium

-- Create subscription type enum
CREATE TYPE subscription_type AS ENUM ('free', 'basic', 'enhanced', 'premium');

-- Create subscription_types table
CREATE TABLE IF NOT EXISTS subscription_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name subscription_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_types_name ON subscription_types(name);
CREATE INDEX IF NOT EXISTS idx_subscription_types_active ON subscription_types(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_types_sort_order ON subscription_types(sort_order);

-- Insert default subscription types
INSERT INTO subscription_types (name, display_name, description, sort_order, is_active)
VALUES
  ('free', 'Free', 'Free subscription tier with basic features', 0, true),
  ('basic', 'Basic', 'Basic subscription tier', 1, true),
  ('enhanced', 'Enhanced', 'Enhanced subscription tier with additional features', 2, true),
  ('premium', 'Premium', 'Premium subscription tier with all features', 3, true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE subscription_types ENABLE ROW LEVEL SECURITY;

-- Public can read subscription types
CREATE POLICY "Public can read subscription types" ON subscription_types
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Super admins can manage subscription types
CREATE POLICY "Super admins can manage subscription types" ON subscription_types
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_types_updated_at') THEN
    CREATE TRIGGER update_subscription_types_updated_at BEFORE UPDATE ON subscription_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


