-- ========================================
-- MIGRATION 050: Create Savannah, GA Test Data
-- ========================================
-- Creates 1 law firm in Savannah, GA (DMA 507) with 5 lawyers
-- Randomizes subscription types and zip codes for DMA testing

-- Add is_test_data column if it doesn't exist (for self-contained migration)
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

DO $$
DECLARE
  -- State ID
  ga_state_id UUID;
  
  -- City ID
  savannah_city_id UUID;
  
  -- Firm ID
  savannah_firm_id UUID;
  
  -- DMA ID
  savannah_dma_id UUID;
  
  -- Zip code array (common zip codes for Savannah, GA)
  savannah_zips TEXT[] := ARRAY['31401', '31402', '31403', '31404', '31405', '31406', '31407', '31408', '31409', '31410', '31411', '31412', '31414', '31415', '31416', '31418', '31419', '31420', '31421'];
  
  -- Subscription types
  subscription_types subscription_type[] := ARRAY['free', 'basic', 'enhanced', 'premium']::subscription_type[];
  
  -- Lawyer names (first and last)
  first_names TEXT[] := ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'];
  last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips'];
  
  -- Specializations
  specializations TEXT[] := ARRAY['Divorce', 'Family Law', 'Child Custody', 'Child Support', 'Alimony/Spousal Support', 'Property Division', 'High Asset Divorce', 'Prenuptial Agreements', 'Postnuptial Agreements', 'Mediation', 'Collaborative Divorce', 'Domestic Violence', 'Adoption', 'Guardianship'];
  
  -- Counter
  i INTEGER;
  j INTEGER;
  lawyer_id UUID;
  random_zip TEXT;
  random_subscription subscription_type;
  random_first_name TEXT;
  random_last_name TEXT;
  random_specializations TEXT[];
  num_specializations INTEGER;
  random_years INTEGER;
  random_rating DECIMAL(3,2);
  random_review_count INTEGER;
  slug_base TEXT;
  email_base TEXT;
  zip_id UUID;
  
BEGIN
  -- Get state ID
  SELECT id INTO ga_state_id FROM states WHERE abbreviation = 'GA' LIMIT 1;
  
  IF ga_state_id IS NULL THEN
    RAISE EXCEPTION 'State GA not found. Please seed states first.';
  END IF;
  
  -- Get or create Savannah city
  SELECT id INTO savannah_city_id FROM cities WHERE name = 'Savannah' AND state_id = ga_state_id LIMIT 1;
  IF savannah_city_id IS NULL THEN
    INSERT INTO cities (name, slug, state_id, created_at, updated_at)
    VALUES ('Savannah', 'savannah-ga', ga_state_id, NOW(), NOW())
    RETURNING id INTO savannah_city_id;
  END IF;
  
  -- Create or get zip codes for Savannah (create first 10)
  FOR i IN 1..10 LOOP
    IF i <= array_length(savannah_zips, 1) THEN
      INSERT INTO zip_codes (zip_code, city_id, created_at)
      VALUES (savannah_zips[i], savannah_city_id, NOW())
      ON CONFLICT (zip_code) DO NOTHING;
    END IF;
  END LOOP;
  
  -- Create or get Savannah DMA (507) and map zip codes
  SELECT id INTO savannah_dma_id FROM dmas WHERE code = 507 LIMIT 1;
  IF savannah_dma_id IS NULL THEN
    INSERT INTO dmas (code, name, slug, created_at, updated_at)
    VALUES (507, 'Savannah', 'savannah', NOW(), NOW())
    RETURNING id INTO savannah_dma_id;
  END IF;
  
  -- Map all Savannah zip codes to DMA
  INSERT INTO zip_code_dmas (zip_code_id, dma_id, created_at)
  SELECT zc.id, savannah_dma_id, NOW()
  FROM zip_codes zc
  WHERE zc.zip_code = ANY(savannah_zips)
  ON CONFLICT (zip_code_id) DO UPDATE SET dma_id = savannah_dma_id;
  
  -- Delete existing Savannah test data if it exists (to allow re-running migration)
  DELETE FROM lawyer_service_areas lsa WHERE lsa.lawyer_id IN (
    SELECT l.id FROM lawyers l
    JOIN law_firms lf ON l.law_firm_id = lf.id
    WHERE lf.slug = 'savannah-family-law-associates'
  );
  DELETE FROM lawyers l WHERE l.law_firm_id IN (
    SELECT id FROM law_firms WHERE slug = 'savannah-family-law-associates'
  );
  DELETE FROM law_firms WHERE slug = 'savannah-family-law-associates';
  
  -- Create Savannah Law Firm
  INSERT INTO law_firms (
    name, slug, description, city_id, phone, email, website, logo_url,
    rating, review_count, verified, featured, street_address, zip_code, state_id,
    is_test_data, created_at, updated_at
  ) VALUES (
    'Savannah Family Law Associates',
    'savannah-family-law-associates',
    'Premier family law practice serving Savannah and the Coastal Georgia region. Our experienced attorneys provide compassionate representation in divorce, child custody, and all family law matters.',
    savannah_city_id,
    '(912) 555-0400',
    'info@savannahfamilylaw.com',
    'https://www.savannahfamilylaw.com',
    'https://picsum.photos/seed/savannah-firm/200/100',
    4.5,
    98,
    true,
    true,
    '456 Bull Street, Suite 300',
    '31401',
    ga_state_id,
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO savannah_firm_id;
  
  -- Create 5 lawyers for Savannah firm
  FOR i IN 1..5 LOOP
    -- Random data
    random_first_name := first_names[LEAST(1 + floor(random() * array_length(first_names, 1))::int, array_length(first_names, 1))];
    random_last_name := last_names[LEAST(1 + floor(random() * array_length(last_names, 1))::int, array_length(last_names, 1))];
    random_zip := savannah_zips[LEAST(1 + floor(random() * array_length(savannah_zips, 1))::int, array_length(savannah_zips, 1))];
    random_subscription := subscription_types[LEAST(1 + floor(random() * array_length(subscription_types, 1))::int, array_length(subscription_types, 1))];
    num_specializations := 3 + floor(random() * 5)::int; -- 3-7 specializations
    random_years := 5 + floor(random() * 30)::int; -- 5-35 years
    random_rating := 3.5 + (random() * 1.5); -- 3.5-5.0
    random_review_count := floor(random() * 200)::int; -- 0-200 reviews
    
    -- Build specializations array
    random_specializations := ARRAY[]::TEXT[];
    FOR j IN 1..num_specializations LOOP
      random_specializations := random_specializations || specializations[LEAST(1 + floor(random() * array_length(specializations, 1))::int, array_length(specializations, 1))];
    END LOOP;
    
    -- Create unique slug and email
    slug_base := lower(replace(random_first_name || '-' || random_last_name || '-savannah-' || i::text, ' ', '-'));
    email_base := lower(replace(random_first_name || '.' || random_last_name || i::text, ' ', '')) || '@savannahfamilylaw.com';
    
    -- Get zip code ID
    SELECT id INTO zip_id FROM zip_codes WHERE zip_code = random_zip LIMIT 1;
    
    -- Create lawyer
    INSERT INTO lawyers (
      first_name, last_name, slug, law_firm_id, title, bio, photo_url, email, phone,
      years_experience, specializations, rating, review_count, verified, featured,
      subscription_type, office_city_id, office_state_id, office_zip_code,
      is_test_data, created_at, updated_at
    ) VALUES (
      random_first_name,
      random_last_name,
      slug_base,
      savannah_firm_id,
      CASE 
        WHEN random_years > 20 THEN 'Senior Partner'
        WHEN random_years > 10 THEN 'Partner'
        ELSE 'Associate Attorney'
      END,
      random_first_name || ' ' || random_last_name || ' is an experienced family law attorney with ' || random_years || ' years of practice. Specializing in family law matters including divorce, child custody, and property division. Known for compassionate client service and strong courtroom advocacy.',
      'https://picsum.photos/seed/' || slug_base || '/300/400',
      email_base,
      '(912) 555-' || lpad((4000 + i)::text, 4, '0'),
      random_years,
      random_specializations,
      random_rating,
      random_review_count,
      CASE WHEN random() > 0.3 THEN true ELSE false END, -- 70% verified
      CASE WHEN random() > 0.7 THEN true ELSE false END, -- 30% featured
      random_subscription,
      savannah_city_id,
      ga_state_id,
      random_zip,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO lawyer_id;
  END LOOP;
  
  RAISE NOTICE '✅ Savannah test data created successfully!';
  RAISE NOTICE 'Created 1 law firm:';
  RAISE NOTICE '  - Savannah Family Law Associates (ID: %)', savannah_firm_id;
  RAISE NOTICE 'Created 5 lawyers for Savannah firm';
  RAISE NOTICE 'All lawyers have randomized subscription types and zip codes for DMA testing';
  RAISE NOTICE 'DMA: Savannah (507) - different from Atlanta DMA';
  
END $$;

