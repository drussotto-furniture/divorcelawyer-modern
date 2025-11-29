-- Fix: Ensure users can read their own profile
-- This should already exist, but let's make sure

-- Drop and recreate the policy to ensure it works
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Allow users to read their own profile by ID
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Also create a policy that allows reading if email matches (for edge cases)
-- This helps when the user ID might not match exactly
DROP POLICY IF EXISTS "Users can read own profile by email" ON profiles;

-- Note: The main policy uses ID which is the correct approach
-- The login code should use data.user.id to match the profile

