-- Fix: Ensure profile exists for existing users
-- This creates profiles for any auth users that don't have one

-- Create profiles for any auth users missing profiles
INSERT INTO profiles (id, email, role)
SELECT 
  au.id,
  au.email,
  'user' -- Default role, can be updated later
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Specifically fix danrussotto@gmail.com if it exists
INSERT INTO profiles (id, email, role)
SELECT 
  id,
  email,
  'super_admin'
FROM auth.users
WHERE email = 'danrussotto@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', email = EXCLUDED.email;

-- Verify the trigger exists and is working
DO $$
BEGIN
  -- Check if trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Recreate the trigger if it doesn't exist
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

