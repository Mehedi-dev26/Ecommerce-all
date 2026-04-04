
-- Mustard Oil
UPDATE products SET image_url = '/images/mustard-oil.jpg', images = ARRAY['/images/mustard-oil.jpg'] WHERE id = 'd9b53a75-aab3-473e-a5b7-4c77d19282b2';

-- Mango Pickle (2 images)
UPDATE products SET image_url = '/images/mango-pickle-1.jpg', images = ARRAY['/images/mango-pickle-1.jpg', '/images/mango-pickle-2.jpg'] WHERE id = '4b37f695-7dfc-427a-8391-dabe2e238f05';

-- Garlic Pickle
UPDATE products SET image_url = '/images/garlic-pickle.jpg', images = ARRAY['/images/garlic-pickle.jpg'] WHERE id = 'decf1a5c-16db-488b-aec6-ed508373ec7e';

-- Langra Mango
UPDATE products SET image_url = '/images/langra-mango.jpg', images = ARRAY['/images/langra-mango.jpg'] WHERE id = '4945f66e-99a9-48cb-bba9-3c897c192f96';

-- Tamarind Pickle (using black cumin pickle image as closest match)
UPDATE products SET image_url = '/images/black-cumin-pickle.jpg', images = ARRAY['/images/black-cumin-pickle.jpg'] WHERE id = '8110519d-4bbf-411f-ad17-8f5dcc4a871d';

-- Rajshahi Mango Himsagar (using lychee tree image - fruit on tree)
UPDATE products SET image_url = '/images/lychee.jpg', images = ARRAY['/images/lychee.jpg'] WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';
