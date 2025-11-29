-- Quick fix: Create profile for danrussotto@gmail.com
-- Run this after creating the user in Supabase Auth

INSERT INTO profiles (id, email, role)
SELECT 
  id,
  email,
  'super_admin'
FROM auth.users
WHERE email = 'danrussotto@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', email = EXCLUDED.email;

