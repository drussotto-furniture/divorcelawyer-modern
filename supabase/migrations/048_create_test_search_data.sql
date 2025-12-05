-- ========================================
-- MIGRATION 048: Create Test Search Data
-- ========================================
-- Creates 3 law firms (Miami, Los Angeles, Dallas) with 15 lawyers each
-- Randomizes subscription types and zip codes for DMA testing

-- Add is_test_data column if it doesn't exist (for self-contained migration)
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

DO $$
DECLARE
  -- State IDs
  fl_state_id UUID;
  ca_state_id UUID;
  tx_state_id UUID;
  
  -- City IDs
  miami_city_id UUID;
  la_city_id UUID;
  dallas_city_id UUID;
  
  -- Firm IDs
  miami_firm_id UUID;
  la_firm_id UUID;
  dallas_firm_id UUID;
  
  -- DMA IDs
  miami_dma_id UUID;
  la_dma_id UUID;
  dallas_dma_id UUID;
  
  -- Zip code arrays (common zip codes for each city)
  miami_zips TEXT[] := ARRAY['33101', '33102', '33109', '33110', '33111', '33112', '33116', '33119', '33122', '33125', '33126', '33127', '33128', '33129', '33130', '33131', '33132', '33133', '33134', '33135', '33136', '33137', '33138', '33139', '33140', '33141', '33142', '33143', '33144', '33145', '33146', '33147', '33149', '33150', '33151', '33152', '33153', '33154', '33155', '33156', '33157', '33158', '33159', '33160', '33161', '33162', '33163', '33164', '33165', '33166', '33167', '33168', '33169', '33170', '33172', '33173', '33174', '33175', '33176', '33177', '33178', '33179', '33180', '33181', '33182', '33183', '33184', '33185', '33186', '33187', '33188', '33189', '33190', '33193', '33194', '33195', '33196', '33197', '33199'];
  la_zips TEXT[] := ARRAY['90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90009', '90010', '90011', '90012', '90013', '90014', '90015', '90016', '90017', '90018', '90019', '90020', '90021', '90022', '90023', '90024', '90025', '90026', '90027', '90028', '90029', '90030', '90031', '90032', '90033', '90034', '90035', '90036', '90037', '90038', '90039', '90040', '90041', '90042', '90043', '90044', '90045', '90046', '90047', '90048', '90049', '90056', '90057', '90058', '90059', '90061', '90062', '90063', '90064', '90065', '90066', '90067', '90068', '90069', '90071', '90077', '90089', '90094', '90095', '90210', '90211', '90212', '90230', '90232', '90291', '90292', '90293', '90401', '90402', '90403', '90404', '90405'];
  dallas_zips TEXT[] := ARRAY['75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210', '75211', '75212', '75214', '75215', '75216', '75217', '75218', '75219', '75220', '75221', '75222', '75223', '75224', '75225', '75226', '75227', '75228', '75229', '75230', '75231', '75232', '75233', '75234', '75235', '75236', '75237', '75238', '75240', '75241', '75243', '75244', '75246', '75247', '75248', '75249', '75250', '75251', '75252', '75253', '75254', '75260', '75261', '75263', '75264', '75265', '75266', '75267', '75270', '75275', '75277', '75283', '75284', '75285', '75287', '75301', '75303', '75312', '75313', '75315', '75320', '75326', '75336', '75339', '75342', '75354', '75355', '75356', '75357', '75358', '75359', '75360', '75367', '75370', '75371', '75372', '75373', '75374', '75378', '75379', '75380', '75381', '75382', '75389', '75390', '75391', '75392', '75393', '75394', '75395', '75397', '75398'];
  
  -- Subscription types
  subscription_types subscription_type[] := ARRAY['free', 'basic', 'enhanced', 'premium']::subscription_type[];
  
  -- Lawyer names (first and last)
  first_names TEXT[] := ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'];
  last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips'];
  
  -- Specializations
  specializations TEXT[] := ARRAY['Divorce', 'Family Law', 'Child Custody', 'Child Support', 'Alimony/Spousal Support', 'Property Division', 'High Asset Divorce', 'Prenuptial Agreements', 'Postnuptial Agreements', 'Mediation', 'Collaborative Divorce', 'Domestic Violence', 'Adoption', 'Guardianship'];
  
  -- Professional headshot photo IDs from Unsplash
  headshot_photo_ids TEXT[] := ARRAY[
    '1507003211169-0a1dd7228f2d',
    '1494790108377-be9c29b29330',
    '1500648767791-00dcc994a43e',
    '1506794778202-cad84cf45f1d',
    '1438761681033-6461ffad8d80',
    '1472099645785-5658abf4ff4e',
    '1508214751196-bcfd4ca60f91',
    '1519085360753-af0119f7cbe7',
    '1534528741775-53994a69daeb',
    '1517841905240-472988bdfe0b',
    '1527980965255-d3b416303d12',
    '1539571696357-5a69c17a67c6',
    '1492562080023-ab3db95bfbce',
    '1507003211169-0a1dd7228f2d',
    '1506794778202-cad84cf45f1d'
  ];
  
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
  -- Get state IDs
  SELECT id INTO fl_state_id FROM states WHERE abbreviation = 'FL' LIMIT 1;
  SELECT id INTO ca_state_id FROM states WHERE abbreviation = 'CA' LIMIT 1;
  SELECT id INTO tx_state_id FROM states WHERE abbreviation = 'TX' LIMIT 1;
  
  IF fl_state_id IS NULL OR ca_state_id IS NULL OR tx_state_id IS NULL THEN
    RAISE EXCEPTION 'Required states (FL, CA, TX) not found. Please seed states first.';
  END IF;
  
  -- Get or create cities
  -- Miami
  SELECT id INTO miami_city_id FROM cities WHERE name = 'Miami' AND state_id = fl_state_id LIMIT 1;
  IF miami_city_id IS NULL THEN
    INSERT INTO cities (name, slug, state_id, created_at, updated_at)
    VALUES ('Miami', 'miami-fl', fl_state_id, NOW(), NOW())
    RETURNING id INTO miami_city_id;
  END IF;
  
  -- Los Angeles
  SELECT id INTO la_city_id FROM cities WHERE name = 'Los Angeles' AND state_id = ca_state_id LIMIT 1;
  IF la_city_id IS NULL THEN
    INSERT INTO cities (name, slug, state_id, created_at, updated_at)
    VALUES ('Los Angeles', 'los-angeles-ca', ca_state_id, NOW(), NOW())
    RETURNING id INTO la_city_id;
  END IF;
  
  -- Dallas
  SELECT id INTO dallas_city_id FROM cities WHERE name = 'Dallas' AND state_id = tx_state_id LIMIT 1;
  IF dallas_city_id IS NULL THEN
    INSERT INTO cities (name, slug, state_id, created_at, updated_at)
    VALUES ('Dallas', 'dallas-tx', tx_state_id, NOW(), NOW())
    RETURNING id INTO dallas_city_id;
  END IF;
  
  -- Create or get zip codes for each city (create first 20 of each)
  -- This ensures we have zip codes to assign to lawyers
  FOR i IN 1..20 LOOP
    -- Miami zips
    INSERT INTO zip_codes (zip_code, city_id, created_at)
    VALUES (miami_zips[i], miami_city_id, NOW())
    ON CONFLICT (zip_code) DO NOTHING;
    
    -- LA zips
    INSERT INTO zip_codes (zip_code, city_id, created_at)
    VALUES (la_zips[i], la_city_id, NOW())
    ON CONFLICT (zip_code) DO NOTHING;
    
    -- Dallas zips
    INSERT INTO zip_codes (zip_code, city_id, created_at)
    VALUES (dallas_zips[i], dallas_city_id, NOW())
    ON CONFLICT (zip_code) DO NOTHING;
  END LOOP;
  
  -- Create or get DMAs and map zip codes
  -- Miami DMA (528 - Miami-Ft. Lauderdale)
  SELECT id INTO miami_dma_id FROM dmas WHERE code = 528 LIMIT 1;
  IF miami_dma_id IS NULL THEN
    INSERT INTO dmas (code, name, slug, created_at, updated_at)
    VALUES (528, 'Miami-Ft. Lauderdale', 'miami-ft-lauderdale', NOW(), NOW())
    RETURNING id INTO miami_dma_id;
  END IF;
  
  -- Map all Miami zip codes to DMA
  INSERT INTO zip_code_dmas (zip_code_id, dma_id, created_at)
  SELECT zc.id, miami_dma_id, NOW()
  FROM zip_codes zc
  WHERE zc.zip_code = ANY(miami_zips)
  ON CONFLICT (zip_code_id) DO UPDATE SET dma_id = miami_dma_id;
  
  -- Los Angeles DMA (803)
  SELECT id INTO la_dma_id FROM dmas WHERE code = 803 LIMIT 1;
  IF la_dma_id IS NULL THEN
    INSERT INTO dmas (code, name, slug, created_at, updated_at)
    VALUES (803, 'Los Angeles', 'los-angeles', NOW(), NOW())
    RETURNING id INTO la_dma_id;
  END IF;
  
  -- Map all LA zip codes to DMA
  INSERT INTO zip_code_dmas (zip_code_id, dma_id, created_at)
  SELECT zc.id, la_dma_id, NOW()
  FROM zip_codes zc
  WHERE zc.zip_code = ANY(la_zips)
  ON CONFLICT (zip_code_id) DO UPDATE SET dma_id = la_dma_id;
  
  -- Dallas DMA (623 - Dallas-Ft. Worth)
  SELECT id INTO dallas_dma_id FROM dmas WHERE code = 623 LIMIT 1;
  IF dallas_dma_id IS NULL THEN
    INSERT INTO dmas (code, name, slug, created_at, updated_at)
    VALUES (623, 'Dallas-Ft. Worth', 'dallas-ft-worth', NOW(), NOW())
    RETURNING id INTO dallas_dma_id;
  END IF;
  
  -- Map all Dallas zip codes to DMA
  INSERT INTO zip_code_dmas (zip_code_id, dma_id, created_at)
  SELECT zc.id, dallas_dma_id, NOW()
  FROM zip_codes zc
  WHERE zc.zip_code = ANY(dallas_zips)
  ON CONFLICT (zip_code_id) DO UPDATE SET dma_id = dallas_dma_id;
  
  -- Delete existing test data if it exists (to allow re-running migration)
  -- Delete only the specific test firms and their lawyers
  DELETE FROM lawyer_service_areas lsa WHERE lsa.lawyer_id IN (
    SELECT l.id FROM lawyers l
    JOIN law_firms lf ON l.law_firm_id = lf.id
    WHERE lf.slug IN ('miami-family-law-group', 'los-angeles-divorce-attorneys', 'dallas-family-law-partners')
  );
  DELETE FROM lawyers l WHERE l.law_firm_id IN (
    SELECT id FROM law_firms WHERE slug IN ('miami-family-law-group', 'los-angeles-divorce-attorneys', 'dallas-family-law-partners')
  );
  DELETE FROM law_firms WHERE slug IN ('miami-family-law-group', 'los-angeles-divorce-attorneys', 'dallas-family-law-partners');
  
  -- Create Miami Law Firm
  INSERT INTO law_firms (
    name, slug, description, city_id, phone, email, website, logo_url,
    rating, review_count, verified, featured, street_address, zip_code, state_id,
    is_test_data, created_at, updated_at
  ) VALUES (
    'Miami Family Law Group',
    'miami-family-law-group',
    'Premier family law firm serving Miami and surrounding areas. Our experienced attorneys specialize in divorce, child custody, and complex family law matters.',
    miami_city_id,
    '(305) 555-0100',
    'info@miamifamilylaw.com',
    'https://www.miamifamilylaw.com',
    'https://picsum.photos/seed/miami-firm/200/100',
    4.7,
    142,
    true,
    true,
    '123 Brickell Avenue, Suite 500',
    '33131',
    fl_state_id,
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO miami_firm_id;
  
  -- Create Los Angeles Law Firm
  INSERT INTO law_firms (
    name, slug, description, city_id, phone, email, website, logo_url,
    rating, review_count, verified, featured, street_address, zip_code, state_id,
    is_test_data, created_at, updated_at
  ) VALUES (
    'Los Angeles Divorce Attorneys',
    'los-angeles-divorce-attorneys',
    'Leading family law practice in Los Angeles. We provide expert representation in divorce, custody, and high-asset division cases throughout Southern California.',
    la_city_id,
    '(310) 555-0200',
    'contact@ladivorceattorneys.com',
    'https://www.ladivorceattorneys.com',
    'https://picsum.photos/seed/la-firm/200/100',
    4.8,
    189,
    true,
    true,
    '456 Sunset Boulevard, Suite 1200',
    '90028',
    ca_state_id,
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO la_firm_id;
  
  -- Create Dallas Law Firm
  INSERT INTO law_firms (
    name, slug, description, city_id, phone, email, website, logo_url,
    rating, review_count, verified, featured, street_address, zip_code, state_id,
    is_test_data, created_at, updated_at
  ) VALUES (
    'Dallas Family Law Partners',
    'dallas-family-law-partners',
    'Trusted family law firm in Dallas. Our team of dedicated attorneys handles all aspects of family law including divorce, child custody, and property division.',
    dallas_city_id,
    '(214) 555-0300',
    'info@dallasfamilylaw.com',
    'https://www.dallasfamilylaw.com',
    'https://picsum.photos/seed/dallas-firm/200/100',
    4.6,
    156,
    true,
    true,
    '789 Main Street, Suite 800',
    '75201',
    tx_state_id,
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO dallas_firm_id;
  
  -- Create 15 lawyers for Miami firm
  FOR i IN 1..15 LOOP
    -- Random data (using LEAST to ensure we never exceed array bounds)
    random_first_name := first_names[LEAST(1 + floor(random() * array_length(first_names, 1))::int, array_length(first_names, 1))];
    random_last_name := last_names[LEAST(1 + floor(random() * array_length(last_names, 1))::int, array_length(last_names, 1))];
    random_zip := miami_zips[LEAST(1 + floor(random() * array_length(miami_zips, 1))::int, array_length(miami_zips, 1))];
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
    slug_base := lower(replace(random_first_name || '-' || random_last_name || '-miami-' || i::text, ' ', '-'));
    email_base := lower(replace(random_first_name || '.' || random_last_name || i::text, ' ', '')) || '@miamifamilylaw.com';
    
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
      miami_firm_id,
      CASE 
        WHEN random_years > 20 THEN 'Senior Partner'
        WHEN random_years > 10 THEN 'Partner'
        ELSE 'Associate Attorney'
      END,
      random_first_name || ' ' || random_last_name || ' is an experienced family law attorney with ' || random_years || ' years of practice. Specializing in family law matters including divorce, child custody, and property division. Known for compassionate client service and strong courtroom advocacy.',
      'https://images.unsplash.com/photo-' || headshot_photo_ids[LEAST(1 + ((i - 1) % array_length(headshot_photo_ids, 1))::int, array_length(headshot_photo_ids, 1))] || '?w=400&h=500&fit=crop&crop=face',
      email_base,
      '(305) 555-' || lpad((1000 + i)::text, 4, '0'),
      random_years,
      random_specializations,
      random_rating,
      random_review_count,
      CASE WHEN random() > 0.3 THEN true ELSE false END, -- 70% verified
      CASE WHEN random() > 0.7 THEN true ELSE false END, -- 30% featured
      random_subscription,
      miami_city_id,
      fl_state_id,
      random_zip,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO lawyer_id;
  END LOOP;
  
  -- Create 15 lawyers for Los Angeles firm
  FOR i IN 1..15 LOOP
    -- Random data (using LEAST to ensure we never exceed array bounds)
    random_first_name := first_names[LEAST(1 + floor(random() * array_length(first_names, 1))::int, array_length(first_names, 1))];
    random_last_name := last_names[LEAST(1 + floor(random() * array_length(last_names, 1))::int, array_length(last_names, 1))];
    random_zip := la_zips[LEAST(1 + floor(random() * array_length(la_zips, 1))::int, array_length(la_zips, 1))];
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
    slug_base := lower(replace(random_first_name || '-' || random_last_name || '-la-' || i::text, ' ', '-'));
    email_base := lower(replace(random_first_name || '.' || random_last_name || i::text, ' ', '')) || '@ladivorceattorneys.com';
    
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
      la_firm_id,
      CASE 
        WHEN random_years > 20 THEN 'Senior Partner'
        WHEN random_years > 10 THEN 'Partner'
        ELSE 'Associate Attorney'
      END,
      random_first_name || ' ' || random_last_name || ' is an experienced family law attorney with ' || random_years || ' years of practice. Specializing in family law matters including divorce, child custody, and property division. Known for compassionate client service and strong courtroom advocacy.',
      'https://images.unsplash.com/photo-' || headshot_photo_ids[LEAST(1 + ((i - 1) % array_length(headshot_photo_ids, 1))::int, array_length(headshot_photo_ids, 1))] || '?w=400&h=500&fit=crop&crop=face',
      email_base,
      '(310) 555-' || lpad((2000 + i)::text, 4, '0'),
      random_years,
      random_specializations,
      random_rating,
      random_review_count,
      CASE WHEN random() > 0.3 THEN true ELSE false END, -- 70% verified
      CASE WHEN random() > 0.7 THEN true ELSE false END, -- 30% featured
      random_subscription,
      la_city_id,
      ca_state_id,
      random_zip,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO lawyer_id;
  END LOOP;
  
  -- Create 15 lawyers for Dallas firm
  FOR i IN 1..15 LOOP
    -- Random data (using LEAST to ensure we never exceed array bounds)
    random_first_name := first_names[LEAST(1 + floor(random() * array_length(first_names, 1))::int, array_length(first_names, 1))];
    random_last_name := last_names[LEAST(1 + floor(random() * array_length(last_names, 1))::int, array_length(last_names, 1))];
    random_zip := dallas_zips[LEAST(1 + floor(random() * array_length(dallas_zips, 1))::int, array_length(dallas_zips, 1))];
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
    slug_base := lower(replace(random_first_name || '-' || random_last_name || '-dallas-' || i::text, ' ', '-'));
    email_base := lower(replace(random_first_name || '.' || random_last_name || i::text, ' ', '')) || '@dallasfamilylaw.com';
    
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
      dallas_firm_id,
      CASE 
        WHEN random_years > 20 THEN 'Senior Partner'
        WHEN random_years > 10 THEN 'Partner'
        ELSE 'Associate Attorney'
      END,
      random_first_name || ' ' || random_last_name || ' is an experienced family law attorney with ' || random_years || ' years of practice. Specializing in family law matters including divorce, child custody, and property division. Known for compassionate client service and strong courtroom advocacy.',
      'https://images.unsplash.com/photo-' || headshot_photo_ids[LEAST(1 + ((i - 1) % array_length(headshot_photo_ids, 1))::int, array_length(headshot_photo_ids, 1))] || '?w=400&h=500&fit=crop&crop=face',
      email_base,
      '(214) 555-' || lpad((3000 + i)::text, 4, '0'),
      random_years,
      random_specializations,
      random_rating,
      random_review_count,
      CASE WHEN random() > 0.3 THEN true ELSE false END, -- 70% verified
      CASE WHEN random() > 0.7 THEN true ELSE false END, -- 30% featured
      random_subscription,
      dallas_city_id,
      tx_state_id,
      random_zip,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO lawyer_id;
  END LOOP;
  
  RAISE NOTICE '✅ Test search data created successfully!';
  RAISE NOTICE 'Created 3 law firms:';
  RAISE NOTICE '  - Miami Family Law Group (ID: %)', miami_firm_id;
  RAISE NOTICE '  - Los Angeles Divorce Attorneys (ID: %)', la_firm_id;
  RAISE NOTICE '  - Dallas Family Law Partners (ID: %)', dallas_firm_id;
  RAISE NOTICE 'Created 45 lawyers total (15 per firm)';
  RAISE NOTICE 'All lawyers have randomized subscription types and zip codes for DMA testing';
  
END $$;

