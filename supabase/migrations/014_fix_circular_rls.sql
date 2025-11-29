-- Fix: Remove circular dependency in RLS policies
-- The "Super admins can read all profiles" policy was causing 500 errors
-- because it tried to query profiles to check if user is super admin,
-- which itself was subject to RLS

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- Recreate using the SECURITY DEFINER function (bypasses RLS)
CREATE POLICY "Super admins can read all profiles" ON profiles
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can update all profiles" ON profiles
  FOR UPDATE USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Also ensure the basic read policy is correct
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

