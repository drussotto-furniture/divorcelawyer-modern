-- Migration: Add drussotto@hotmail.com as test lawyer for profile claiming
-- This creates a test lawyer that can be used to test the claim profile flow

DO $$
DECLARE
  test_firm_id UUID;
  test_city_id UUID;
  test_lawyer_id UUID;
  existing_lawyer_id UUID;
BEGIN
  -- Get or create test law firm
  SELECT id INTO test_firm_id FROM law_firms WHERE slug = 'test-law-firm' LIMIT 1;
  
  IF test_firm_id IS NULL THEN
    -- Get first city for the firm
    SELECT id INTO test_city_id FROM cities LIMIT 1;
    
    IF test_city_id IS NULL THEN
      RAISE EXCEPTION 'No cities found. Please seed cities first.';
    END IF;
    
    -- Create test law firm
    INSERT INTO law_firms (
      name, slug, description, city_id, phone, email, verified
    ) VALUES (
      'Test Law Firm',
      'test-law-firm',
      'Test law firm for admin testing and profile claiming',
      test_city_id,
      '(555) 123-4567',
      'test@testlawfirm.com',
      true
    ) RETURNING id INTO test_firm_id;
    
    RAISE NOTICE 'Created test law firm: %', test_firm_id;
  ELSE
    RAISE NOTICE 'Using existing test law firm: %', test_firm_id;
  END IF;

  -- Check if lawyer already exists
  SELECT id INTO existing_lawyer_id 
  FROM lawyers 
  WHERE email = 'drussotto@hotmail.com';
  
  IF existing_lawyer_id IS NOT NULL THEN
    -- Update existing lawyer to link to test firm
    UPDATE lawyers
    SET 
      law_firm_id = test_firm_id,
      first_name = 'Dan',
      last_name = 'Russotto',
      slug = 'dan-russotto',
      title = 'Test Attorney',
      bio = 'Test lawyer profile for testing the claim profile functionality. This profile can be claimed using the email drussotto@hotmail.com.',
      phone = '(555) 987-6543',
      verified = true,
      updated_at = NOW()
    WHERE id = existing_lawyer_id;
    
    test_lawyer_id := existing_lawyer_id;
    RAISE NOTICE 'Updated existing lawyer: %', test_lawyer_id;
  ELSE
    -- Create new test lawyer
    INSERT INTO lawyers (
      first_name,
      last_name,
      slug,
      law_firm_id,
      title,
      bio,
      email,
      phone,
      bar_number,
      years_experience,
      specializations,
      education,
      bar_admissions,
      awards,
      rating,
      review_count,
      verified,
      featured
    ) VALUES (
      'Dan',
      'Russotto',
      'dan-russotto',
      test_firm_id,
      'Test Attorney',
      'Test lawyer profile for testing the claim profile functionality. This profile can be claimed using the email drussotto@hotmail.com.',
      'drussotto@hotmail.com',
      '(555) 987-6543',
      'TEST-12345',
      10,
      ARRAY['Divorce', 'Family Law', 'Child Custody'],
      ARRAY['Juris Doctor, Test Law School'],
      ARRAY['Georgia'],
      ARRAY['Test Award 2024'],
      4.5,
      25,
      true,
      false
    ) RETURNING id INTO test_lawyer_id;
    
    RAISE NOTICE 'Created test lawyer: %', test_lawyer_id;
  END IF;

  -- Get a city for service areas (if cities exist)
  SELECT id INTO test_city_id FROM cities LIMIT 1;
  
  IF test_city_id IS NOT NULL THEN
    -- Add service area for the lawyer
    INSERT INTO lawyer_service_areas (lawyer_id, city_id)
    VALUES (test_lawyer_id, test_city_id)
    ON CONFLICT (lawyer_id, city_id) DO NOTHING;
    
    RAISE NOTICE 'Added service area for lawyer';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST LAWYER CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Email: drussotto@hotmail.com';
  RAISE NOTICE 'Name: Dan Russotto';
  RAISE NOTICE 'Law Firm: Test Law Firm';
  RAISE NOTICE 'Lawyer ID: %', test_lawyer_id;
  RAISE NOTICE 'Law Firm ID: %', test_firm_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the claim profile flow at:';
  RAISE NOTICE '/claim-profile';
  RAISE NOTICE '';

END $$;



