-- Migration: Admin Write Access Policies
-- Adds INSERT, UPDATE, DELETE policies for super admins on admin-managed tables

-- Admin write access to homepage_content
CREATE POLICY "Super admins can manage homepage content" ON homepage_content
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin write access to site_settings
CREATE POLICY "Super admins can manage site settings" ON site_settings
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin write access to real_voices_stories
CREATE POLICY "Super admins can manage real voices stories" ON real_voices_stories
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin write access to content_categories
CREATE POLICY "Super admins can manage content categories" ON content_categories
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin read access to all homepage_content (not just active)
CREATE POLICY "Super admins can read all homepage content" ON homepage_content
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin read access to all real_voices_stories (not just published)
CREATE POLICY "Super admins can read all real voices stories" ON real_voices_stories
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin read access to all content_categories (not just active)
CREATE POLICY "Super admins can read all content categories" ON content_categories
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to content_blocks
CREATE POLICY "Super admins can manage content blocks" ON content_blocks
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin read access to all content_blocks (not just active)
CREATE POLICY "Super admins can read all content blocks" ON content_blocks
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

