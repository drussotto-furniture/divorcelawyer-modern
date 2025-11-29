-- COMPLETE FIX: Create profile and verify everything works
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check if user exists
DO $$
DECLARE
  user_id_val UUID;
  user_email TEXT;
BEGIN
  SELECT id, email INTO user_id_val, user_email
  FROM auth.users
  WHERE email = 'danrussotto@gmail.com'
  LIMIT 1;

  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'ERROR: User danrussotto@gmail.com not found in auth.users. Please create the user in Supabase Dashboard first.';
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', user_email, user_id_val;

  -- Step 2: Create or update profile
  INSERT INTO profiles (id, email, role)
  VALUES (user_id_val, user_email, 'super_admin')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'super_admin', email = EXCLUDED.email;

  RAISE NOTICE 'Profile created/updated successfully';
END $$;

-- Step 3: Verify profile exists and can be read
SELECT 
  'VERIFICATION' as step,
  p.id,
  p.email,
  p.role,
  'Profile exists!' as status
FROM profiles p
WHERE p.email = 'danrussotto@gmail.com';

-- Step 4: Check RLS policies
SELECT 
  'RLS Policy Check' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

