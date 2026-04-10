-- =============================================
-- COMPLETE DATABASE SCHEMA FOR SUPABASE PROJECT
-- Copy this entire SQL and run in Supabase SQL Editor
-- to recreate the full database structure
-- =============================================


-- ── Migration: 20260404055349_81b287f9-85f7-41ff-b730-4dc0cf732f4f.sql ──


-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  weight TEXT,
  unit TEXT DEFAULT 'piece',
  stock INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  notes TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products: public read
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Orders: anyone can insert, select by phone
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders by phone" ON public.orders FOR SELECT USING (true);

-- Order items: public read
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, name_bn, description, sort_order) VALUES
('Pickles', 'আচার', 'Traditional Bangladeshi pickles made with authentic recipes', 1),
('Fruits', 'ফল', 'Fresh seasonal fruits from Bangladesh', 2),
('Oils', 'তেল', 'Pure and natural cooking oils', 3),
('Dry Foods', 'শুকনো খাবার', 'Premium quality dry foods and spices', 4),
('Honey & Dates', 'মধু ও খেজুর', 'Natural honey and premium dates', 5);

-- Seed products
INSERT INTO public.products (category_id, name, name_bn, description, description_bn, price, compare_price, weight, unit, stock, is_featured) VALUES
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Mango Pickle', 'আমের আচার', 'Authentic homemade mango pickle with traditional spices', 'ঘরে তৈরি খাঁটি আমের আচার, দেশি মসলা দিয়ে তৈরি', 350, 400, '500g', 'jar', 50, true),
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Tamarind Pickle', 'তেঁতুলের আচার', 'Tangy tamarind pickle made with fresh tamarind', 'টাটকা তেঁতুল দিয়ে তৈরি টক আচার', 300, null, '500g', 'jar', 40, true),
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Garlic Pickle', 'রসুনের আচার', 'Spicy garlic pickle with mustard oil', 'সরিষার তেলে তৈরি ঝাল রসুনের আচার', 320, 380, '500g', 'jar', 35, false),
((SELECT id FROM public.categories WHERE name = 'Fruits'), 'Rajshahi Mango (Himsagar)', 'রাজশাহীর আম (হিমসাগর)', 'Premium Himsagar mangoes from Rajshahi', 'রাজশাহীর প্রিমিয়াম হিমসাগর আম', 1200, 1500, '5kg', 'box', 100, true),
((SELECT id FROM public.categories WHERE name = 'Fruits'), 'Langra Mango', 'ল্যাংড়া আম', 'Sweet and aromatic Langra mangoes', 'মিষ্টি ও সুগন্ধি ল্যাংড়া আম', 1000, null, '5kg', 'box', 80, false),
((SELECT id FROM public.categories WHERE name = 'Oils'), 'Pure Mustard Oil', 'খাঁটি সরিষার তেল', '100% pure cold-pressed mustard oil from local farms', '১০০% খাঁটি ঘানি ভাঙ্গা সরিষার তেল', 450, 550, '1L', 'bottle', 60, true),
((SELECT id FROM public.categories WHERE name = 'Oils'), 'Coconut Oil', 'নারিকেল তেল', 'Virgin coconut oil, naturally extracted', 'প্রাকৃতিক উপায়ে নিষ্কাশিত নারিকেল তেল', 500, null, '500ml', 'bottle', 30, false),
((SELECT id FROM public.categories WHERE name = 'Dry Foods'), 'Dried Fish (Shutki)', 'শুটকি মাছ', 'Premium quality sun-dried fish', 'প্রিমিয়াম মানের রোদে শুকানো শুটকি', 800, 950, '500g', 'pack', 25, true),
((SELECT id FROM public.categories WHERE name = 'Honey & Dates'), 'Sundarbans Honey', 'সুন্দরবনের মধু', 'Pure honey collected from Sundarbans', 'সুন্দরবন থেকে সংগৃহীত খাঁটি মধু', 700, 850, '500g', 'jar', 45, true),
((SELECT id FROM public.categories WHERE name = 'Honey & Dates'), 'Ajwa Dates', 'আজওয়া খেজুর', 'Premium Ajwa dates from Saudi Arabia', 'সৌদি আরব থেকে আনা প্রিমিয়াম আজওয়া খেজুর', 1500, 1800, '1kg', 'box', 20, true);


-- ── Migration: 20260404063210_35dd5faa-06ed-4c06-9cb7-85c64c6bd4c6.sql ──


UPDATE products SET description_bn = 'ঘরে তৈরি খাঁটি আমের আচার, দেশি মসলা দিয়ে প্রস্তুত। আমাদের আমের আচার সম্পূর্ণ হাতে তৈরি এবং কোনো প্রকার কেমিক্যাল বা প্রিজারভেটিভ ব্যবহার করা হয়নি। সরিষার তেল, মেথি, কালোজিরা, মরিচ ও লবণ দিয়ে ঐতিহ্যবাহী রেসিপিতে তৈরি এই আচার আপনার খাবারের স্বাদ বাড়িয়ে তুলবে। গরম ভাতের সাথে বা পরোটার সাথে এই আচারের জুড়ি নেই।', description = 'Authentic homemade mango pickle prepared with traditional Bengali spices. Our mango pickle is completely handmade without any chemicals or preservatives. Made with mustard oil, fenugreek, black cumin, chili and salt in a traditional recipe, this pickle will enhance the taste of your food.' WHERE id = '4b37f695-7dfc-427a-8391-dabe2e238f05';

UPDATE products SET description_bn = 'টাটকা তেঁতুল দিয়ে তৈরি টক-ঝাল আচার। এই আচার তৈরিতে ব্যবহার করা হয়েছে পাকা তেঁতুল, সরিষার তেল, পাঁচফোড়ন, শুকনো মরিচ এবং লবণ। তেঁতুলের আচার খাবারে একটি অনন্য টক স্বাদ যোগ করে। ভাত, খিচুড়ি বা যেকোনো খাবারের সাথে এই আচার পরিবেশন করতে পারেন। সম্পূর্ণ প্রাকৃতিক উপাদানে তৈরি।', description = 'Tangy tamarind pickle made with fresh ripe tamarind, mustard oil, panch phoron, dried chili and salt. This pickle adds a unique sour flavor to your meals. Can be served with rice, khichuri or any dish. Made entirely with natural ingredients.' WHERE id = '8110519d-4bbf-411f-ad17-8f5dcc4a871d';

UPDATE products SET description_bn = 'সরিষার তেলে তৈরি ঝাল রসুনের আচার। তাজা রসুন, সরিষার তেল, মরিচের গুঁড়া, হলুদ এবং লবণ দিয়ে তৈরি এই আচার স্বাদে অতুলনীয়। রসুনের আচার শুধু সুস্বাদুই নয়, স্বাস্থ্যের জন্যও উপকারী। এটি রোগ প্রতিরোধ ক্ষমতা বাড়ায় এবং হজমে সহায়তা করে। প্রতিদিনের খাবারের সাথে অল্প পরিমাণ রসুনের আচার খেলে শরীর সুস্থ থাকে।', description = 'Spicy garlic pickle made with mustard oil. Prepared with fresh garlic, mustard oil, chili powder, turmeric and salt. Garlic pickle is not only delicious but also beneficial for health. It boosts immunity and aids digestion.' WHERE id = 'decf1a5c-16db-488b-aec6-ed508373ec7e';

UPDATE products SET description_bn = 'রাজশাহীর বিখ্যাত প্রিমিয়াম হিমসাগর আম। এই আম মিষ্টি, রসালো এবং অত্যন্ত সুগন্ধি। রাজশাহীর উর্বর মাটিতে জন্মানো এই আম সারা বাংলাদেশে বিখ্যাত। কোনো প্রকার কার্বাইড বা কেমিক্যাল ব্যবহার করা হয়নি। গাছ পাকা আম সরাসরি বাগান থেকে সংগ্রহ করে আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়। প্রতিটি আম হাতে বাছাই করা এবং মান নিয়ন্ত্রিত।', description = 'Premium Himsagar mangoes from Rajshahi. These mangoes are sweet, juicy and extremely aromatic. Grown in the fertile soil of Rajshahi, these mangoes are famous across Bangladesh. No carbide or chemicals used. Tree-ripened mangoes collected directly from orchards and delivered to your doorstep.' WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';

UPDATE products SET description_bn = 'মিষ্টি ও সুগন্ধি ল্যাংড়া আম। ল্যাংড়া আম বাংলাদেশের অন্যতম জনপ্রিয় আমের জাত। এই আমের বিশেষত্ব হলো এর অনন্য মিষ্টি স্বাদ এবং মনমাতানো সুগন্ধ। সম্পূর্ণ প্রাকৃতিকভাবে পাকানো, কোনো রাসায়নিক দ্রব্য ব্যবহার করা হয়নি। তাজা অবস্থায় সরাসরি বাগান থেকে সংগ্রহ করে যত্নসহকারে প্যাকেজিং করে পাঠানো হয়।', description = 'Sweet and aromatic Langra mangoes. Langra is one of the most popular mango varieties in Bangladesh. The specialty of this mango is its unique sweet taste and captivating aroma. Completely naturally ripened, no chemicals used. Collected fresh from orchards and carefully packaged for delivery.' WHERE id = '4945f66e-99a9-48cb-bba9-3c897c192f96';


-- ── Migration: 20260404071259_655fe303-42cc-44c3-9979-e2cbcca871bb.sql ──


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


-- ── Migration: 20260404071734_a9b74d6c-0657-4427-8a14-286cce6cbe1b.sql ──


-- Rename Himsagar to Lychee
UPDATE products SET 
  name = 'Rajshahi Lychee',
  name_bn = 'রাজশাহীর লিচি',
  description = 'Rajshahi is famous for producing the finest lychees in Bangladesh. Our fresh Rajshahi lychees are handpicked at peak ripeness, offering an incredibly sweet and juicy flavor. Each fruit is carefully selected to ensure the best quality, bringing the authentic taste of Rajshahi orchards directly to your home.',
  description_bn = 'রাজশাহী বাংলাদেশের সবচেয়ে সুস্বাদু লিচির জন্য বিখ্যাত। আমাদের তাজা রাজশাহীর লিচি পরিপূর্ণ পাকা অবস্থায় হাতে বাছাই করা হয়, যা অবিশ্বাস্য রকম মিষ্টি ও রসালো স্বাদ দেয়। প্রতিটি ফল সর্বোচ্চ মান নিশ্চিত করে যত্নের সাথে বাছাই করা হয়, রাজশাহীর বাগানের খাঁটি স্বাদ সরাসরি আপনার ঘরে পৌঁছে দেয়।'
WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';

-- Make all products featured so they show in homepage
UPDATE products SET is_featured = true WHERE is_featured = false;


-- ── Migration: 20260404071852_face8005-c973-428e-a7fc-ff05441eb15f.sql ──


UPDATE products SET image_url = '/images/sundarbans-honey.jpg', images = ARRAY['/images/sundarbans-honey.jpg'] WHERE id = '047c51ce-b371-487d-89df-ecd197da1a31';
UPDATE products SET image_url = '/images/ajwa-dates.jpg', images = ARRAY['/images/ajwa-dates.jpg'] WHERE id = '436dd866-4f7f-489d-bd39-15c7de44cabf';
UPDATE products SET image_url = '/images/coconut-oil.jpg', images = ARRAY['/images/coconut-oil.jpg'] WHERE id = 'df226638-26b1-4be1-a67b-a4dc3cc44b78';
UPDATE products SET image_url = '/images/dried-fish.jpg', images = ARRAY['/images/dried-fish.jpg'] WHERE id = '5688fe4d-518d-429d-a3df-7d98354b4043';


-- ── Migration: 20260406082449_c31c1bd2-3cd0-4162-9c54-4aa4b4922fe2.sql ──


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


-- ── Migration: 20260406084019_01ff9694-afe7-4930-90c8-4ee12f70d071.sql ──


-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for products
CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for categories
CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for orders (update status)
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');


-- ── Migration: 20260409160516_a6095fcc-877c-4c5b-afc6-f4f5417f3dc3.sql ──


CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text DEFAULT 'অর্ডার করুন',
  cta_link text DEFAULT '/products',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Migration: 20260409161243_c56b7950-986a-4f52-a81d-1326b1a6948a.sql ──


-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  default_division text,
  default_district text,
  default_upazila text,
  default_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to orders for linking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Migration: 20260409194332_de2d750f-c7be-4e35-8bc9-fab536211ebd.sql ──


-- Add Pathao tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pathao_consignment_id text,
  ADD COLUMN IF NOT EXISTS pathao_order_status text,
  ADD COLUMN IF NOT EXISTS pathao_tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders(pathao_consignment_id) WHERE pathao_consignment_id IS NOT NULL;


-- ── Migration: 20260410095359_a54c817d-133d-4f4e-9753-88b0057fdfe1.sql ──


CREATE TABLE public.abandoned_checkouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text,
  customer_phone text,
  customer_email text,
  division text,
  district text,
  upazila text,
  shipping_address text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  user_id uuid,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all abandoned checkouts"
ON public.abandoned_checkouts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update own abandoned checkout"
ON public.abandoned_checkouts FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete abandoned checkouts"
ON public.abandoned_checkouts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_abandoned_checkouts_updated_at
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ── Migration: 20260410101209_f42df2d2-950f-44b1-9ae4-0c8ae81135c6.sql ──


CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default footer settings
INSERT INTO public.site_settings (key, value, label) VALUES
  ('footer_phone', '+880 1798-268989', 'ফোন নম্বর'),
  ('footer_email', 'info@sapaharmango.com', 'ইমেইল'),
  ('footer_location', 'সাপাহার, নওগাঁ, বাংলাদেশ', 'ঠিকানা'),
  ('footer_facebook', '#', 'ফেসবুক লিংক'),
  ('footer_copyright', '© {year} Sapahar Mango — সাপাহারের দেশি আম। সর্বস্বত্ব সংরক্ষিত।', 'কপিরাইট টেক্সট');


-- ── Migration: 20260410102350_a10cba6a-7431-45f8-8eaf-b06d08fba9f7.sql ──


CREATE TABLE public.courier_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  district text NOT NULL,
  upazila text,
  charge_per_kg numeric NOT NULL DEFAULT 0,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(division, district, upazila)
);

ALTER TABLE public.courier_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courier charges"
ON public.courier_charges FOR SELECT
USING (true);

CREATE POLICY "Admins can insert courier charges"
ON public.courier_charges FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courier charges"
ON public.courier_charges FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courier charges"
ON public.courier_charges FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_courier_charges_updated_at
BEFORE UPDATE ON public.courier_charges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Migration: 20260410105536_13f2ccaf-4c1b-4fd0-959a-cbf0009ebab9.sql ──

ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS show_text_overlay boolean NOT NULL DEFAULT true;
