-- Migration: Create test data for Law Firm and Lawyer with all fields populated
-- This helps verify that all form fields are working correctly
-- Note: This will delete and recreate test data if it already exists

-- First, get a city ID (use the first available city)
DO $$
DECLARE
  test_city_id UUID;
  test_firm_id UUID;
  test_lawyer_id UUID;
  existing_firm_id UUID;
  existing_lawyer_id UUID;
BEGIN
  -- Get first city
  SELECT id INTO test_city_id FROM cities LIMIT 1;
  
  IF test_city_id IS NULL THEN
    RAISE EXCEPTION 'No cities found. Please seed cities first.';
  END IF;

  -- Delete existing test data if it exists (to allow re-running this migration)
  SELECT id INTO existing_firm_id FROM law_firms WHERE slug = 'test-law-firm';
  IF existing_firm_id IS NOT NULL THEN
    -- Delete service areas first (foreign key constraint)
    DELETE FROM lawyer_service_areas WHERE lawyer_id IN (
      SELECT id FROM lawyers WHERE slug = 'test-lawyer'
    );
    -- Delete test lawyer
    DELETE FROM lawyers WHERE slug = 'test-lawyer';
    -- Delete test firm
    DELETE FROM law_firms WHERE slug = 'test-law-firm';
    RAISE NOTICE 'Deleted existing test data';
  END IF;

  -- Create TEST Law Firm with ALL fields populated
  -- Note: Run migration 022 first to add missing columns (content, logo_url, review_count, featured, meta_title, meta_description)
  INSERT INTO law_firms (
    name, slug, description, content, address, city_id, phone, email, website,
    logo_url, linkedin_url, facebook_url, twitter_url, founded_year, firm_size,
    practice_areas, rating, review_count, verified, featured, meta_title, meta_description
  ) VALUES (
    'TEST Law Firm',
    'test-law-firm',
    'This is a comprehensive test law firm description. It includes multiple sentences to test the description field. The firm specializes in family law and divorce cases, with extensive experience in high-net-worth divorces, child custody disputes, and complex property division matters.',
    '<p>This is the HTML content for TEST Law Firm. It can contain rich formatting and multiple paragraphs.</p><p>This content is typically managed by super admins and may include detailed firm information, history, and other important details.</p>',
    '123 Test Street, Suite 100',
    test_city_id,
    '(555) 123-4567',
    'test@testlawfirm.com',
    'https://www.testlawfirm.com',
    'https://via.placeholder.com/200x100?text=TEST+Law+Firm',
    'https://www.linkedin.com/company/test-law-firm',
    'https://www.facebook.com/testlawfirm',
    'https://www.twitter.com/testlawfirm',
    2010,
    'Medium (10-50 attorneys)',
    ARRAY[
      'Divorce',
      'Family Law',
      'Child Custody',
      'Child Support',
      'Alimony/Spousal Support',
      'Property Division',
      'High Asset Divorce',
      'Mediation',
      'Collaborative Divorce'
    ],
    4.8,
    127,
    true,
    true,
    'TEST Law Firm - Expert Family Law Attorneys | Divorce Lawyers',
    'TEST Law Firm provides expert family law and divorce representation. Our experienced attorneys handle complex cases including high-net-worth divorces, child custody, and property division.'
  ) RETURNING id INTO test_firm_id;

  -- Create TEST Lawyer with ALL fields populated
  -- Note: Run migration 022 first to add missing columns (rating, review_count, verified, featured, meta_title, meta_description)
  INSERT INTO lawyers (
    first_name, last_name, slug, law_firm_id, title, bio, photo_url, email, phone,
    bar_number, years_experience, specializations, education, awards, bar_admissions,
    publications, professional_memberships, certifications, languages, linkedin_url,
    twitter_url, practice_focus, approach, consultation_fee, accepts_new_clients,
    consultation_available, office_address, office_hours, credentials_summary,
    media_mentions, speaking_engagements, rating, review_count, verified, featured,
    meta_title, meta_description
  ) VALUES (
    'TEST',
    'Lawyer',
    'test-lawyer',
    test_firm_id,
    'Senior Partner & Divorce Attorney',
    'TEST Lawyer is a highly experienced family law attorney with over 15 years of practice. Specializing in complex divorce cases, high-net-worth divorces, and child custody disputes. TEST Lawyer has successfully represented hundreds of clients and is known for a collaborative yet assertive approach to family law matters. With a strong track record of favorable outcomes, TEST Lawyer combines legal expertise with compassionate client service.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    'test.lawyer@testlawfirm.com',
    '(555) 987-6543',
    'GA-12345',
    15,
    ARRAY[
      'Divorce',
      'Family Law',
      'Child Custody',
      'Child Support',
      'Alimony/Spousal Support',
      'Property Division',
      'High Asset Divorce',
      'Prenuptial Agreements',
      'Postnuptial Agreements',
      'Mediation',
      'Collaborative Divorce'
    ],
    ARRAY[
      'Juris Doctor (J.D.), Harvard Law School, 2008',
      'Bachelor of Arts (B.A.) in Political Science, Yale University, 2005',
      'Magna Cum Laude, Dean''s List'
    ],
    ARRAY[
      'Top 10 Attorney - Georgia, Super Lawyers (2020-2024)',
      'Georgia Super Lawyers Top 100 since 2018',
      'Martindale-Hubbell AV Peer Review Rated for Ethical Standards and Legal Ability',
      'Best Lawyers in America - Family Law (2019-2024)',
      'Atlanta Magazine Top Lawyers (2021-2024)'
    ],
    ARRAY[
      'State Bar of Georgia',
      'Supreme Court of the United States',
      'Supreme Court of Georgia',
      'U.S. District Court for the Northern District of Georgia',
      'U.S. Court of Appeals for the Eleventh Circuit'
    ],
    ARRAY[
      '"Arbitration and Family Law" - Atlanta Family Law Section Breakfast, 2023',
      '"Jury Charges Are Not Just for Jury Trials" - Annual State Bar of Georgia Family Law Institute, 2022',
      '"Managing Mental Chatter: How to Tame Worry and Rumination for You and Your Client During Litigation" - Georgia Chapter of American Academy of Matrimonial Lawyers, 2021',
      '"Complex Asset Division in High-Net-Worth Divorces" - Family Law Quarterly, 2020'
    ],
    ARRAY[
      'Fellow, American Academy of Matrimonial Lawyers',
      'Fellow, International Academy of Family Lawyers',
      'Former Chair, State Bar of Georgia Family Law Section',
      'Member, Atlanta Bar Association',
      'Member, Georgia Trial Lawyers Association'
    ],
    ARRAY[
      'Board Certified Family Law',
      'Certified Divorce Financial Analyst',
      'Certified Mediator',
      'Certified Family Law Specialist'
    ],
    ARRAY['English', 'Spanish', 'French'],
    'https://www.linkedin.com/in/testlawyer',
    'https://www.twitter.com/testlawyer',
    'TEST Lawyer exclusively practices family law with a focus on high-net-worth divorces, complex custody disputes, and collaborative divorce solutions. Known for strategic thinking and compassionate client representation.',
    'TEST Lawyer takes a collaborative yet assertive approach to family law cases. Emphasizing long-term thinking and helping clients make informed decisions based on where they see themselves three to five years from now. TEST Lawyer believes in educating clients throughout the process while maintaining a strong courtroom presence when necessary.',
    '$300 for initial 1-hour consultation',
    true,
    true,
    '123 Test Street, Suite 100, Atlanta, Georgia 30303',
    'Monday-Friday: 9:00 AM - 6:00 PM' || E'\n' || 'Saturday: By appointment only' || E'\n' || 'Sunday: Closed',
    'TEST Lawyer is a Board Certified Family Law Specialist with over 15 years of experience. Recognized as a Top 10 Attorney in Georgia by Super Lawyers and rated AV Preeminent by Martindale-Hubbell. Fellow of the American Academy of Matrimonial Lawyers and former Chair of the State Bar of Georgia Family Law Section.',
    ARRAY[
      'Featured in The New York Times - "Navigating High-Net-Worth Divorces", 2023',
      'Interview on CNN - "Family Law Trends in 2022", 2022',
      'Quoted in Forbes - "Protecting Assets in Divorce", 2021',
      'Featured in Atlanta Magazine - "Top Divorce Attorneys", 2020'
    ],
    ARRAY[
      'Keynote Speaker, Family Law Conference, Atlanta, 2023',
      'Panelist, ABA Annual Meeting - "Complex Asset Division", 2022',
      'Presenter, State Bar of Georgia Family Law Institute, 2021',
      'Speaker, American Academy of Matrimonial Lawyers Annual Conference, 2020'
    ],
    4.9,
    89,
    true,
    true,
    'TEST Lawyer - Expert Divorce & Family Law Attorney | TEST Law Firm',
    'TEST Lawyer is an experienced family law attorney specializing in high-net-worth divorces, child custody, and complex property division. Board certified and recognized as a Top 10 Attorney in Georgia.'
  ) RETURNING id INTO test_lawyer_id;

  -- Create service areas for the lawyer (link to first 5 cities)
  INSERT INTO lawyer_service_areas (lawyer_id, city_id)
  SELECT test_lawyer_id, id
  FROM cities
  LIMIT 5
  ON CONFLICT (lawyer_id, city_id) DO NOTHING;

  RAISE NOTICE '✅ Test data created successfully!';
  RAISE NOTICE 'Law Firm ID: %', test_firm_id;
  RAISE NOTICE 'Lawyer ID: %', test_lawyer_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Access the forms at:';
  RAISE NOTICE '  Law Firm: /admin/directory/law-firms/%', test_firm_id;
  RAISE NOTICE '  Lawyer: /admin/directory/lawyers/%', test_lawyer_id;

END $$;
