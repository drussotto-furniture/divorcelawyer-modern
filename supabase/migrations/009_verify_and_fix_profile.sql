-- Verify and fix profile for danrussotto@gmail.com
-- Run this to check and create/update the profile

-- First, check if user exists
DO $$
DECLARE
  user_id_val UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get user ID
  SELECT id INTO user_id_val
  FROM auth.users
  WHERE email = 'danrussotto@gmail.com';

  IF user_id_val IS NULL THEN
    RAISE NOTICE 'User danrussotto@gmail.com not found in auth.users';
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id_val) INTO profile_exists;

  IF NOT profile_exists THEN
    -- Create profile
    INSERT INTO profiles (id, email, role)
    VALUES (user_id_val, 'danrussotto@gmail.com', 'super_admin');
    RAISE NOTICE 'Profile created for danrussotto@gmail.com';
  ELSE
    -- Update profile to ensure it's super_admin
    UPDATE profiles
    SET role = 'super_admin', email = 'danrussotto@gmail.com'
    WHERE id = user_id_val;
    RAISE NOTICE 'Profile updated for danrussotto@gmail.com';
  END IF;
END $$;

-- Verify it worked
SELECT 
  p.id,
  p.email,
  p.role,
  au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.email = 'danrussotto@gmail.com';

