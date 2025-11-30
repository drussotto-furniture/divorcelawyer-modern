-- Migration: Create Test Users for Admin Panel
-- NOTE: This migration only sets up profiles. Users must be created via:
-- 1. Node.js script: node scripts/create-test-users.js (RECOMMENDED)
-- 2. Supabase Dashboard → Authentication → Users
--
-- After creating users in Auth, run this migration to set up their profiles.
-- Or use the Node.js script which does everything automatically.

-- This migration assumes users already exist in auth.users
-- It will update their profiles with correct roles and links

DO $$
DECLARE
  admin_user_id UUID;
  lawyer_user_id UUID;
  law_firm_user_id UUID;
  test_law_firm_id UUID;
  test_lawyer_id UUID;
BEGIN
  -- Get or create a test law firm
  SELECT id INTO test_law_firm_id
  FROM law_firms
  LIMIT 1;

  -- If no law firm exists, create one
  IF test_law_firm_id IS NULL THEN
    INSERT INTO law_firms (name, slug, description)
    VALUES ('Test Law Firm', 'test-law-firm', 'Test law firm for admin testing')
    RETURNING id INTO test_law_firm_id;
  END IF;

  -- Get or create a test lawyer
  SELECT id INTO test_lawyer_id
  FROM lawyers
  WHERE law_firm_id = test_law_firm_id
  LIMIT 1;

  -- If no lawyer exists for this firm, create one
  IF test_lawyer_id IS NULL THEN
    INSERT INTO lawyers (
      first_name, last_name, slug, law_firm_id, title, bio, email, phone
    )
    VALUES (
      'Test', 'Lawyer', 'test-lawyer', test_law_firm_id, 
      'Test Attorney', 'Test lawyer profile for admin testing',
      'test.lawyer@example.com', '555-0100'
    )
    RETURNING id INTO test_lawyer_id;
  END IF;

  -- ============================================
  -- 1. CREATE SUPER ADMIN USER
  -- ============================================
  -- Email: admin@divorcelawyer.com
  -- Password: Admin123!
  -- Role: super_admin
  -- Access: Full admin panel access

  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@divorcelawyer.com';

  IF admin_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@divorcelawyer.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;

    -- Create profile with super_admin role
    INSERT INTO profiles (id, email, role, name)
    VALUES (admin_user_id, 'admin@divorcelawyer.com', 'super_admin', 'Super Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', name = 'Super Admin';
  ELSE
    -- Update existing profile to super_admin
    UPDATE profiles
    SET role = 'super_admin', name = 'Super Admin'
    WHERE id = admin_user_id;
  END IF;

  RAISE NOTICE '✅ Super Admin User Created';
  RAISE NOTICE '   Email: admin@divorcelawyer.com';
  RAISE NOTICE '   Password: Admin123!';
  RAISE NOTICE '   User ID: %', admin_user_id;

  -- ============================================
  -- 2. CREATE LAWYER USER
  -- ============================================
  -- Email: lawyer@divorcelawyer.com
  -- Password: Lawyer123!
  -- Role: lawyer
  -- Access: Only their own profile (lawyer_id linked)

  -- Check if lawyer user already exists
  SELECT id INTO lawyer_user_id
  FROM auth.users
  WHERE email = 'lawyer@divorcelawyer.com';

  IF lawyer_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'lawyer@divorcelawyer.com',
      crypt('Lawyer123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO lawyer_user_id;

    -- Create profile with lawyer role and link to lawyer
    INSERT INTO profiles (id, email, role, name, lawyer_id)
    VALUES (lawyer_user_id, 'lawyer@divorcelawyer.com', 'lawyer', 'Test Lawyer', test_lawyer_id)
    ON CONFLICT (id) DO UPDATE 
    SET role = 'lawyer', name = 'Test Lawyer', lawyer_id = test_lawyer_id;
  ELSE
    -- Update existing profile to lawyer
    UPDATE profiles
    SET role = 'lawyer', name = 'Test Lawyer', lawyer_id = test_lawyer_id
    WHERE id = lawyer_user_id;
  END IF;

  RAISE NOTICE '✅ Lawyer User Created';
  RAISE NOTICE '   Email: lawyer@divorcelawyer.com';
  RAISE NOTICE '   Password: Lawyer123!';
  RAISE NOTICE '   User ID: %', lawyer_user_id;
  RAISE NOTICE '   Lawyer ID: %', test_lawyer_id;

  -- ============================================
  -- 3. CREATE LAW FIRM ADMIN USER
  -- ============================================
  -- Email: lawfirm@divorcelawyer.com
  -- Password: LawFirm123!
  -- Role: law_firm
  -- Access: Law firm admin page, can see all lawyers in their firm

  -- Check if law firm user already exists
  SELECT id INTO law_firm_user_id
  FROM auth.users
  WHERE email = 'lawfirm@divorcelawyer.com';

  IF law_firm_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'lawfirm@divorcelawyer.com',
      crypt('LawFirm123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO law_firm_user_id;

    -- Create profile with law_firm role and link to law firm
    INSERT INTO profiles (id, email, role, name, law_firm_id)
    VALUES (law_firm_user_id, 'lawfirm@divorcelawyer.com', 'law_firm', 'Law Firm Admin', test_law_firm_id)
    ON CONFLICT (id) DO UPDATE 
    SET role = 'law_firm', name = 'Law Firm Admin', law_firm_id = test_law_firm_id;
  ELSE
    -- Update existing profile to law_firm
    UPDATE profiles
    SET role = 'law_firm', name = 'Law Firm Admin', law_firm_id = test_law_firm_id
    WHERE id = law_firm_user_id;
  END IF;

  RAISE NOTICE '✅ Law Firm Admin User Created';
  RAISE NOTICE '   Email: lawfirm@divorcelawyer.com';
  RAISE NOTICE '   Password: LawFirm123!';
  RAISE NOTICE '   User ID: %', law_firm_user_id;
  RAISE NOTICE '   Law Firm ID: %', test_law_firm_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST USERS CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Super Admin:';
  RAISE NOTICE '   Email: admin@divorcelawyer.com';
  RAISE NOTICE '   Password: Admin123!';
  RAISE NOTICE '   Access: Full admin panel';
  RAISE NOTICE '';
  RAISE NOTICE '2. Lawyer:';
  RAISE NOTICE '   Email: lawyer@divorcelawyer.com';
  RAISE NOTICE '   Password: Lawyer123!';
  RAISE NOTICE '   Access: Own profile only';
  RAISE NOTICE '';
  RAISE NOTICE '3. Law Firm Admin:';
  RAISE NOTICE '   Email: lawfirm@divorcelawyer.com';
  RAISE NOTICE '   Password: LawFirm123!';
  RAISE NOTICE '   Access: Law firm admin page';
  RAISE NOTICE '';

END $$;

