-- Fix: Allow users to create their own profile if it doesn't exist
-- This helps when the trigger doesn't fire or profile creation fails

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Allow users to insert their own profile
-- This allows authenticated users to create their profile when they first log in
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also explicitly allow upsert for the same user
-- Supabase upsert uses INSERT ... ON CONFLICT, so we need both policies
DROP POLICY IF EXISTS "Users can update own profile on conflict" ON profiles;

-- The UPDATE policy already exists, but let's make sure it works for upsert
-- The existing "Users can update own profile" policy should handle the UPDATE part of upsert

