-- Debug: Check what's happening with the profile
-- Run this to see the current state

-- 1. Check if user exists in auth.users
SELECT 
  'User in auth.users:' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'danrussotto@gmail.com';

-- 2. Check if profile exists
SELECT 
  'Profile in profiles table:' as check_type,
  id,
  email,
  role,
  created_at
FROM profiles
WHERE email = 'danrussotto@gmail.com';

-- 3. Try to create/update profile (run this if profile doesn't exist)
-- Uncomment and run if needed:
/*
INSERT INTO profiles (id, email, role)
SELECT 
  id,
  email,
  'super_admin'
FROM auth.users
WHERE email = 'danrussotto@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', email = EXCLUDED.email;
*/

