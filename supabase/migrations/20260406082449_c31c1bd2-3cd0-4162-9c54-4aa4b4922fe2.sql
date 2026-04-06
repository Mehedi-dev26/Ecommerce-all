
-- First delete all existing order_items and orders to avoid FK issues
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- Delete all existing products
DELETE FROM public.products;

-- Delete all existing categories
DELETE FROM public.categories;

-- Insert mango categories
INSERT INTO public.categories (id, name, name_bn, description, image_url, sort_order) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'Langra', 'ল্যাংড়া', 'সাপাহারের বিখ্যাত ল্যাংড়া আম — সুমিষ্ট ও সুগন্ধি', '/images/langra-mango.jpg', 1),
  ('c1000002-0000-0000-0000-000000000002', 'Himsagar', 'হিমসাগর', 'রসালো ও মিষ্টি হিমসাগর আম', '/images/himsagar-mango.jpg', 2),
  ('c1000003-0000-0000-0000-000000000003', 'Gopalbhog', 'গোপালভোগ', 'ছোট আকারের অত্যন্ত মিষ্টি গোপালভোগ', '/images/gopalbhog-mango.jpg', 3),
  ('c1000004-0000-0000-0000-000000000004', 'Amrapali', 'আম্রপালি', 'গাঢ় কমলা রঙের সুস্বাদু আম্রপালি', '/images/amrapali-mango.jpg', 4),
  ('c1000005-0000-0000-0000-000000000005', 'Fazli', 'ফজলি', 'বড় আকারের রসালো ফজলি আম', '/images/fazli-mango.jpg', 5),
  ('c1000006-0000-0000-0000-000000000006', 'Khirsapat', 'ক্ষীরশাপাত', 'চাঁপাইনবাবগঞ্জের বিখ্যাত ক্ষীরশাপাত আম', '/images/khirsapat-mango.jpg', 6);

-- Insert mango products (2 per category = 12 products)
INSERT INTO public.products (name, name_bn, description, description_bn, category_id, price, compare_price, image_url, weight, unit, stock, is_featured, is_active) VALUES
  -- Langra
  ('Langra Mango 3kg', 'ল্যাংড়া আম (৩ কেজি)', 'Premium Langra mangoes from Sapahar, Naogaon', 'সাপাহারের বিখ্যাত ল্যাংড়া আম। সবুজাভ হলুদ রঙের এই আম অত্যন্ত সুগন্ধি ও মিষ্টি। গাছপাকা, কার্বাইডমুক্ত। প্রতিটি আম হাতে বাছাই করা।', 'c1000001-0000-0000-0000-000000000001', 650, 750, '/images/langra-mango.jpg', '৩ কেজি', 'kg', 50, true, true),
  ('Langra Mango 5kg', 'ল্যাংড়া আম (৫ কেজি)', 'Premium Langra mangoes family pack from Sapahar', 'সাপাহারের প্রিমিয়াম ল্যাংড়া আম ফ্যামিলি প্যাক। ৫ কেজি তাজা গাছপাকা আম। পরিবারের সবার জন্য যথেষ্ট।', 'c1000001-0000-0000-0000-000000000001', 1000, 1200, '/images/langra-mango.jpg', '৫ কেজি', 'kg', 40, true, true),

  -- Himsagar
  ('Himsagar Mango 3kg', 'হিমসাগর আম (৩ কেজি)', 'Sweet Himsagar mangoes from Sapahar', 'সাপাহারের রসালো হিমসাগর আম। গাঢ় হলুদ রঙের এই আম অত্যন্ত মিষ্টি ও রসে ভরা। কোনো কেমিক্যাল ছাড়াই গাছে পাকা।', 'c1000002-0000-0000-0000-000000000002', 700, 800, '/images/himsagar-mango.jpg', '৩ কেজি', 'kg', 45, true, true),
  ('Himsagar Mango 5kg', 'হিমসাগর আম (৫ কেজি)', 'Sweet Himsagar mangoes family pack', 'হিমসাগর আম ফ্যামিলি প্যাক। ৫ কেজি খাঁটি গাছপাকা আম। মিষ্টি ও সুগন্ধি — উৎসবে বা উপহারে আদর্শ।', 'c1000002-0000-0000-0000-000000000002', 1100, 1300, '/images/himsagar-mango.jpg', '৫ কেজি', 'kg', 35, true, true),

  -- Gopalbhog
  ('Gopalbhog Mango 3kg', 'গোপালভোগ আম (৩ কেজি)', 'Early season Gopalbhog mangoes', 'মৌসুমের শুরুতেই পাওয়া যায় এই ছোট আকারের অত্যন্ত মিষ্টি গোপালভোগ আম। সাপাহারের বাগান থেকে সরাসরি।', 'c1000003-0000-0000-0000-000000000003', 600, 700, '/images/gopalbhog-mango.jpg', '৩ কেজি', 'kg', 30, true, true),
  ('Gopalbhog Mango 5kg', 'গোপালভোগ আম (৫ কেজি)', 'Early season Gopalbhog mangoes family pack', 'গোপালভোগ আম ফ্যামিলি প্যাক। ছোট আকারের মিষ্টি আম, শিশুদের খুবই পছন্দ। ৫ কেজি প্যাক।', 'c1000003-0000-0000-0000-000000000003', 950, 1100, '/images/gopalbhog-mango.jpg', '৫ কেজি', 'kg', 25, true, true),

  -- Amrapali
  ('Amrapali Mango 3kg', 'আম্রপালি আম (৩ কেজি)', 'Hybrid Amrapali mangoes from Sapahar', 'আম্রপালি হাইব্রিড জাতের আম — গাঢ় কমলা রঙের শাঁস, অত্যন্ত মিষ্টি ও সুগন্ধি। আঁশবিহীন, খেতে খুবই সুস্বাদু।', 'c1000004-0000-0000-0000-000000000004', 550, 650, '/images/amrapali-mango.jpg', '৩ কেজি', 'kg', 40, true, true),
  ('Amrapali Mango 5kg', 'আম্রপালি আম (৫ কেজি)', 'Hybrid Amrapali mangoes family pack', 'আম্রপালি আম ফ্যামিলি প্যাক। ৫ কেজি তাজা আম্রপালি — জুস, স্মুদি বা সরাসরি খাওয়ার জন্য আদর্শ।', 'c1000004-0000-0000-0000-000000000004', 850, 1000, '/images/amrapali-mango.jpg', '৫ কেজি', 'kg', 35, true, true),

  -- Fazli
  ('Fazli Mango 3kg', 'ফজলি আম (৩ কেজি)', 'Large Fazli mangoes from Sapahar', 'বড় আকারের ফজলি আম — মৌসুমের শেষে পাওয়া যায়। রসালো ও হালকা মিষ্টি স্বাদ। আচার বা জুস তৈরিতে অসাধারণ।', 'c1000005-0000-0000-0000-000000000005', 500, 600, '/images/fazli-mango.jpg', '৩ কেজি', 'kg', 50, true, true),
  ('Fazli Mango 5kg', 'ফজলি আম (৫ কেজি)', 'Large Fazli mangoes family pack', 'ফজলি আম ফ্যামিলি প্যাক। ৫ কেজি বড় বড় ফজলি আম। পারিবারিক আয়োজনে বা আচার তৈরিতে পারফেক্ট।', 'c1000005-0000-0000-0000-000000000005', 800, 950, '/images/fazli-mango.jpg', '৫ কেজি', 'kg', 45, true, true),

  -- Khirsapat
  ('Khirsapat Mango 3kg', 'ক্ষীরশাপাত আম (৩ কেজি)', 'Premium Khirsapat mangoes', 'ক্ষীরশাপাত আম — অত্যন্ত মিষ্টি ও সুগন্ধি। উজ্জ্বল হলুদ রঙের এই আম বাংলাদেশের অন্যতম সেরা জাত।', 'c1000006-0000-0000-0000-000000000006', 750, 850, '/images/khirsapat-mango.jpg', '৩ কেজি', 'kg', 30, true, true),
  ('Khirsapat Mango 5kg', 'ক্ষীরশাপাত আম (৫ কেজি)', 'Premium Khirsapat mangoes family pack', 'ক্ষীরশাপাত আম ফ্যামিলি প্যাক। ৫ কেজি প্রিমিয়াম ক্ষীরশাপাত। উপহার হিসেবেও আদর্শ।', 'c1000006-0000-0000-0000-000000000006', 1200, 1400, '/images/khirsapat-mango.jpg', '৫ কেজি', 'kg', 25, true, true);
