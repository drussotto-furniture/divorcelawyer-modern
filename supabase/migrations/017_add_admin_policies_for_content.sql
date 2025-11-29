-- Migration: Add Admin Policies for Content Tables
-- Adds SELECT, INSERT, UPDATE, DELETE policies for super admins on content tables
-- that were missing from the initial admin policies migration

-- Drop existing policies if they exist, then create new ones
-- Admin access to questions (read all, not just published)
DROP POLICY IF EXISTS "Super admins can read all questions" ON questions;
CREATE POLICY "Super admins can read all questions" ON questions
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to questions
DROP POLICY IF EXISTS "Super admins can manage questions" ON questions;
CREATE POLICY "Super admins can manage questions" ON questions
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin access to articles (read all, not just published)
DROP POLICY IF EXISTS "Super admins can read all articles" ON articles;
CREATE POLICY "Super admins can read all articles" ON articles
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to articles
DROP POLICY IF EXISTS "Super admins can manage articles" ON articles;
CREATE POLICY "Super admins can manage articles" ON articles
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin access to videos (read all, not just published)
DROP POLICY IF EXISTS "Super admins can read all videos" ON videos;
CREATE POLICY "Super admins can read all videos" ON videos
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to videos
DROP POLICY IF EXISTS "Super admins can manage videos" ON videos;
CREATE POLICY "Super admins can manage videos" ON videos
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin access to stages
DROP POLICY IF EXISTS "Super admins can read all stages" ON stages;
CREATE POLICY "Super admins can read all stages" ON stages
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to stages
DROP POLICY IF EXISTS "Super admins can manage stages" ON stages;
CREATE POLICY "Super admins can manage stages" ON stages
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin access to emotions
DROP POLICY IF EXISTS "Super admins can read all emotions" ON emotions;
CREATE POLICY "Super admins can read all emotions" ON emotions
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to emotions
DROP POLICY IF EXISTS "Super admins can manage emotions" ON emotions;
CREATE POLICY "Super admins can manage emotions" ON emotions
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin access to media (read all)
DROP POLICY IF EXISTS "Super admins can read all media" ON media;
CREATE POLICY "Super admins can read all media" ON media
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Admin write access to media
DROP POLICY IF EXISTS "Super admins can manage media" ON media;
CREATE POLICY "Super admins can manage media" ON media
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

