-- Final fix: Ensure profile exists for danrussotto@gmail.com
-- Run this to guarantee the profile is created

-- Use a DO block to handle this safely
DO $$
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Get the user
  SELECT id, email INTO user_record
  FROM auth.users
  WHERE email = 'danrussotto@gmail.com'
  LIMIT 1;

  -- Check if user exists
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User danrussotto@gmail.com not found in auth.users. Please create the user in Supabase Dashboard first.';
  END IF;

  -- Check if profile exists
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE id = user_record.id;

  -- Create or update profile
  IF profile_count = 0 THEN
    INSERT INTO profiles (id, email, role)
    VALUES (user_record.id, user_record.email, 'super_admin');
    RAISE NOTICE 'Profile created for %', user_record.email;
  ELSE
    UPDATE profiles
    SET role = 'super_admin', email = user_record.email
    WHERE id = user_record.id;
    RAISE NOTICE 'Profile updated for %', user_record.email;
  END IF;
END $$;

-- Verify it worked
SELECT 
  'SUCCESS: Profile exists' as status,
  p.id,
  p.email,
  p.role,
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'Email confirmed' ELSE 'Email NOT confirmed' END as email_status
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.email = 'danrussotto@gmail.com';

