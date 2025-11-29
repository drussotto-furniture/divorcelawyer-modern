-- Migration: Content Blocks Management
-- Adds tables for managing reusable content blocks/components across pages

-- Content Blocks Table
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  component_type TEXT NOT NULL, -- 'three_pack', 'vetting_process', 'need_assistance', 'coming_soon', etc.
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB, -- flexible JSON for component-specific data
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_blocks_slug ON content_blocks(slug);
CREATE INDEX idx_content_blocks_component_type ON content_blocks(component_type);
CREATE INDEX idx_content_blocks_active ON content_blocks(active);
CREATE INDEX idx_content_blocks_order ON content_blocks(component_type, order_index);

-- Trigger for updated_at
CREATE TRIGGER update_content_blocks_updated_at BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

-- Public read access for active blocks
CREATE POLICY "Public read access to active content blocks" ON content_blocks 
  FOR SELECT USING (active = true);

-- Seed initial content blocks
INSERT INTO content_blocks (name, slug, component_type, title, subtitle, description, link_url, link_text, order_index, active) VALUES
  ('Three Pack Title', 'three-pack-title', 'three_pack', 'The Top Divorce Lawyers in your Area', NULL, NULL, NULL, NULL, 1, true),
  ('Three Pack Description', 'three-pack-description', 'three_pack', NULL, NULL, 'Divorce can be complex, and choosing a lawyer among many is often overwhelming. We''ve done the initial screening for you, selecting the right representation, carefully vetted and handpicked for you.', NULL, NULL, 2, true),
  ('Vetting Process Title', 'vetting-process-title', 'vetting_process', 'Our Vetting Process:', 'Ensuring Only the Best', NULL, NULL, NULL, 1, true),
  ('Vetting Process Item 1', 'vetting-process-item-1', 'vetting_process', NULL, NULL, 'We do the hard work of selecting only the best.', NULL, NULL, 2, true),
  ('Vetting Process Item 2', 'vetting-process-item-2', 'vetting_process', NULL, NULL, 'Featured firms are leaders in family law, proven in their field.', NULL, NULL, 3, true),
  ('Vetting Process Item 3', 'vetting-process-item-3', 'vetting_process', NULL, NULL, 'These lawyers helped create this educational content library.', NULL, NULL, 4, true),
  ('Need Assistance Title', 'need-assistance-title', 'need_assistance', 'Need Assistance Sooner?', 'We can help!', NULL, NULL, NULL, 1, true),
  ('Need Assistance Description', 'need-assistance-description', 'need_assistance', NULL, NULL, 'We''re still building our network in your area – it takes time to select the best divorce lawyers. If you need support now, reach out and we''ll make a connection.', NULL, NULL, 2, true),
  ('Need Assistance CTA', 'need-assistance-cta', 'need_assistance', NULL, NULL, NULL, '/about-us/request-a-call/', 'Request A Connection', 3, true)
ON CONFLICT (slug) DO NOTHING;

