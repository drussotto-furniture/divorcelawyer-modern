-- Diagnostic: Check if user exists and profile is set up correctly
-- Run this to troubleshoot login issues

-- Check if user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'danrussotto@gmail.com';

-- Check if profile exists
SELECT 
  id,
  email,
  role,
  name
FROM profiles
WHERE email = 'danrussotto@gmail.com';

-- If user exists but profile doesn't, create it:
-- INSERT INTO profiles (id, email, role)
-- SELECT id, email, 'super_admin'
-- FROM auth.users
-- WHERE email = 'danrussotto@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- If email is not confirmed and you want to confirm it manually:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'danrussotto@gmail.com';

