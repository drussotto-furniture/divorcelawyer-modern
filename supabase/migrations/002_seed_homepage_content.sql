-- Seed initial homepage content data
-- This migrates hardcoded content from the homepage to the database

-- Hero Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('hero', 'title', 'The Best Divorce Lawyers and Expert Resources', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('hero', 'subtitle', NULL, 'Go your <span>own</span> way', NULL, NULL, NULL, NULL, 2, true),
  ('hero', 'description', NULL, NULL, 'We''re your go-to source for all things divorce. From a comprehensive learning portal to vetted divorce specialists in your area, we make sure you have everything you need to move forward with confidence.', NULL, NULL, NULL, 3, true),
  ('hero', 'mobile_image', NULL, NULL, NULL, '/media/NewLife-DivorceLawyer.webp', NULL, NULL, 4, true),
  ('hero', 'desktop_image', NULL, NULL, NULL, '/media/home-1.webp', NULL, NULL, 5, true),
  ('hero', 'cta_find_lawyer', NULL, NULL, NULL, NULL, '/connect-with-lawyer', 'Find a Lawyer', 6, true),
  ('hero', 'cta_learn', NULL, NULL, NULL, NULL, '/learning-center', 'Learn', 7, true)
ON CONFLICT (section, key) DO NOTHING;

-- Discover Slider
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('discover_slider', 'slide_1', NULL, '<span>Discover</span> the Site', 'Explore and access all the educational resources we offer, whether you''re seeking answers, general information, or a top divorce attorney.', '/media/DL-Site-Tour-Slide-1.png', '/about', 'Learn About Us', 1, true),
  ('discover_slider', 'slide_2', NULL, 'Pick a <span>Journey</span>', 'Choose to explore a journey, such as the Stages of Divorce or the Emotions Throughout the Process. Discover valuable resources for insight into your own process.', '/media/pick-a-journey.png', '/stages', 'Explore Stages of Divorce', 2, true),
  ('discover_slider', 'slide_3', NULL, '<span>Learn</span> And Explore', 'Access the site''s learning portal categories for in-depth information, including articles, videos, and more, covering all aspects of divorce.', '/media/explore-all-content-for-divorce.png', '/learning-center', 'Explore Divorce Resources', 3, true),
  ('discover_slider', 'slide_4', NULL, 'Connect with a <span>Vetted</span> Lawyer', 'Ready to take the next step? We''ll help you connect with a top divorce lawyer in your area. It''s just an introduction—no pressure.', '/media/connect-with-vetted-lawyer.png', '/find-lawyer', 'Find a Lawyer', 4, true)
ON CONFLICT (section, key) DO NOTHING;

-- Stages Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('stages_section', 'title', '<span>Stages</span> of Divorce', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('stages_section', 'description', NULL, NULL, 'Divorce can feel like a rollercoaster ride, full of ups and downs. To make it easier, sometimes it''s best to break down the process into distinct stages, each with its unique characteristics and challenges. Click on a stage to explore articles and videos that can provide insight and support for your journey.', NULL, NULL, NULL, 2, true),
  ('stages_section', 'button', NULL, NULL, NULL, NULL, '/stages', 'Learn More about the Stages of Divorce', 3, true)
ON CONFLICT (section, key) DO NOTHING;

-- Emotions Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('emotions_section', 'title', 'The <span>Emotional</span> Path Through Divorce', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('emotions_section', 'description', NULL, NULL, 'A divorce is a major life change, and it''s natural to experience a range of intense emotions along the way. Whether you''re thinking about divorce or already in the middle of it, we''re here to help navigate through it. Click on an emotion to explore and understand the feelings you may be experiencing.', NULL, NULL, NULL, 2, true),
  ('emotions_section', 'button', NULL, NULL, NULL, NULL, '/emotions', 'Explore Emotions Along the Process', 3, true)
ON CONFLICT (section, key) DO NOTHING;

-- Real Voices Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('real_voices_section', 'title', 'Real Voices:<br/><span>Coffee Talk</span>', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('real_voices_section', 'description', NULL, NULL, 'A safe space where real people offer comfort and guidance by sharing their very real divorce stories. Whether contemplating divorce or starting your new life, Coffee Talk will remind you that you''re not alone.', NULL, NULL, NULL, 2, true),
  ('real_voices_section', 'button', NULL, NULL, NULL, NULL, '/real-voices', 'Explore Real Voices', 3, true)
ON CONFLICT (section, key) DO NOTHING;

-- Real Voices Stories
INSERT INTO real_voices_stories (title, description, author, author_display_name, featured, order_index, status) VALUES
  ('I wish I had taken alimony', 'If I were talking to my younger self, I''d say – take the money, it''s yours', NULL, 'Anonymous', true, 1, 'published'),
  ('Who to trust?', 'I had to learn about gaslighting; how someone can manipulate another by making them doubt the truth and reality', 'Tiffany G.', 'Tiffany G.', true, 2, 'published'),
  ('Legal jargon is overwhelming', 'Navigating through my divorce was daunting. The legal jargon felt overwhelming, adding to the stress of an already tough situation.', 'Carrie R.', 'Carrie R.', true, 3, 'published'),
  ('It was never the last time', '20 years of my spouse''s addiction – that''s how long it took me to say enough', NULL, 'Anonymous', true, 4, 'published'),
  ('Am I a failure because I''m getting divorced?', 'When I realized that things were not going to work, that the situation was not going to change, it was an awakening of sorts', 'Jeri E.', 'Jeri E.', true, 5, 'published')
ON CONFLICT DO NOTHING;

-- Categories Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('categories_section', 'title', 'Get Informed.<br/>Get <span>Empowered.</span>', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('categories_section', 'description', NULL, NULL, 'Read up on essential divorce topics to learn more about the process and all its different aspects.', NULL, NULL, NULL, 2, true),
  ('categories_section', 'button', NULL, NULL, NULL, NULL, '/learning-center/categories', 'Browse Categories', 3, true)
ON CONFLICT (section, key) DO NOTHING;

-- Content Categories
INSERT INTO content_categories (name, slug, description, order_index, featured, active) VALUES
  ('Child Custody', 'child-custody', NULL, 1, true, true),
  ('Spousal Support', 'spousal-support', NULL, 2, true, true),
  ('Finances', 'finances', NULL, 3, true, true),
  ('Business Interests', 'business-interests', NULL, 4, true, true),
  ('Separation', 'separation', NULL, 5, true, true),
  ('Behavioral Issues', 'behavioral-issues', NULL, 6, true, true),
  ('The Divorce Process', 'the-divorce-process', NULL, 7, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Connect CTA Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('connect_cta', 'title', 'Introductions, no pressure', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('connect_cta', 'subtitle', NULL, 'Connect with a Top Divorce Attorney', NULL, NULL, NULL, NULL, 2, true),
  ('connect_cta', 'description', NULL, NULL, 'Are you in a different location? We can introduce you to the best family lawyers in your area.', NULL, NULL, NULL, 3, true),
  ('connect_cta', 'image', NULL, NULL, NULL, '/media/connect-with-vetted-lawyer.png', NULL, NULL, 4, true),
  ('connect_cta', 'placeholder', NULL, NULL, 'Type your city or zipcode.', NULL, NULL, NULL, 5, true),
  ('connect_cta', 'button', NULL, NULL, NULL, NULL, NULL, 'Find a Lawyer', 6, true)
ON CONFLICT (section, key) DO NOTHING;

-- FAQ Section
INSERT INTO homepage_content (section, key, title, subtitle, description, image_url, link_url, link_text, order_index, active) VALUES
  ('faq_section', 'title', 'Common <span>Questions</span>', NULL, NULL, NULL, NULL, NULL, 1, true),
  ('faq_section', 'description', NULL, NULL, 'Here are some of the most commonly asked questions about divorce. Click on a question to get a quick answer and access more detailed information.', NULL, NULL, NULL, 2, true),
  ('faq_section', 'subtitle', NULL, NULL, 'Seeking More Answers?', NULL, NULL, NULL, 3, true),
  ('faq_section', 'button', NULL, NULL, NULL, NULL, '/questions', 'Visit Top Questions', 4, true)
ON CONFLICT (section, key) DO NOTHING;

