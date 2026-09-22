-- =====================================================================
-- SAPAHAR SHOP — COMPLETE DATABASE SCHEMA (CONSOLIDATED)
-- Generated: 2026-09-22
-- Source: all 68 migrations, in chronological order.
-- =====================================================================
-- This single file recreates the ENTIRE backend: enums, tables, grants,
-- RLS policies, functions, triggers, storage buckets, realtime config
-- and seed data for a fresh Supabase / Lovable Cloud project.
--
-- HOW TO USE
--   1. New Supabase project -> SQL Editor -> New query
--   2. Paste this whole file -> Run (run it ONCE, top to bottom)
--   3. Put the new SUPABASE_URL + ANON/PUBLISHABLE KEY in your .env
--   4. Re-add edge function secrets:
--        LOVABLE_API_KEY, PATHAO_*, STEADFAST (in courier_providers),
--        GMAIL_USER / GMAIL_APP_PASSWORD (or RESEND_API_KEY)
--   5. Deploy edge functions: guest-auth, vendor-signup, pathao,
--        steadfast, steadfast-webhook, sms-webhook, send-email,
--        support-chat, vendor-support-ai, admin-ai-assistant
--   6. Sign up your admin user, then promote them (see the very bottom)
--
-- TABLES INCLUDED
--   user_roles, profiles, categories, products, banners, promo_strips,
--   courier_charges, courier_providers, saved_addresses, landing_pages,
--   orders, order_items, abandoned_checkouts, customer_reviews,
--   site_settings, email_templates, email_logs, payment_accounts,
--   sms_inbox, business_expenses, inventory_purchases,
--   vendors, vendor_settings, vendor_payouts, vendor_notifications,
--   vendor_support_threads, vendor_support_messages
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ---------------------------------------------------------------------
-- STEP 01/68  (20260404055349)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 02/68  (20260404063210)
-- ---------------------------------------------------------------------
UPDATE products SET description_bn = 'ঘরে তৈরি খাঁটি আমের আচার, দেশি মসলা দিয়ে প্রস্তুত। আমাদের আমের আচার সম্পূর্ণ হাতে তৈরি এবং কোনো প্রকার কেমিক্যাল বা প্রিজারভেটিভ ব্যবহার করা হয়নি। সরিষার তেল, মেথি, কালোজিরা, মরিচ ও লবণ দিয়ে ঐতিহ্যবাহী রেসিপিতে তৈরি এই আচার আপনার খাবারের স্বাদ বাড়িয়ে তুলবে। গরম ভাতের সাথে বা পরোটার সাথে এই আচারের জুড়ি নেই।', description = 'Authentic homemade mango pickle prepared with traditional Bengali spices. Our mango pickle is completely handmade without any chemicals or preservatives. Made with mustard oil, fenugreek, black cumin, chili and salt in a traditional recipe, this pickle will enhance the taste of your food.' WHERE id = '4b37f695-7dfc-427a-8391-dabe2e238f05';

UPDATE products SET description_bn = 'টাটকা তেঁতুল দিয়ে তৈরি টক-ঝাল আচার। এই আচার তৈরিতে ব্যবহার করা হয়েছে পাকা তেঁতুল, সরিষার তেল, পাঁচফোড়ন, শুকনো মরিচ এবং লবণ। তেঁতুলের আচার খাবারে একটি অনন্য টক স্বাদ যোগ করে। ভাত, খিচুড়ি বা যেকোনো খাবারের সাথে এই আচার পরিবেশন করতে পারেন। সম্পূর্ণ প্রাকৃতিক উপাদানে তৈরি।', description = 'Tangy tamarind pickle made with fresh ripe tamarind, mustard oil, panch phoron, dried chili and salt. This pickle adds a unique sour flavor to your meals. Can be served with rice, khichuri or any dish. Made entirely with natural ingredients.' WHERE id = '8110519d-4bbf-411f-ad17-8f5dcc4a871d';

UPDATE products SET description_bn = 'সরিষার তেলে তৈরি ঝাল রসুনের আচার। তাজা রসুন, সরিষার তেল, মরিচের গুঁড়া, হলুদ এবং লবণ দিয়ে তৈরি এই আচার স্বাদে অতুলনীয়। রসুনের আচার শুধু সুস্বাদুই নয়, স্বাস্থ্যের জন্যও উপকারী। এটি রোগ প্রতিরোধ ক্ষমতা বাড়ায় এবং হজমে সহায়তা করে। প্রতিদিনের খাবারের সাথে অল্প পরিমাণ রসুনের আচার খেলে শরীর সুস্থ থাকে।', description = 'Spicy garlic pickle made with mustard oil. Prepared with fresh garlic, mustard oil, chili powder, turmeric and salt. Garlic pickle is not only delicious but also beneficial for health. It boosts immunity and aids digestion.' WHERE id = 'decf1a5c-16db-488b-aec6-ed508373ec7e';

UPDATE products SET description_bn = 'রাজশাহীর বিখ্যাত প্রিমিয়াম হিমসাগর আম। এই আম মিষ্টি, রসালো এবং অত্যন্ত সুগন্ধি। রাজশাহীর উর্বর মাটিতে জন্মানো এই আম সারা বাংলাদেশে বিখ্যাত। কোনো প্রকার কার্বাইড বা কেমিক্যাল ব্যবহার করা হয়নি। গাছ পাকা আম সরাসরি বাগান থেকে সংগ্রহ করে আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়। প্রতিটি আম হাতে বাছাই করা এবং মান নিয়ন্ত্রিত।', description = 'Premium Himsagar mangoes from Rajshahi. These mangoes are sweet, juicy and extremely aromatic. Grown in the fertile soil of Rajshahi, these mangoes are famous across Bangladesh. No carbide or chemicals used. Tree-ripened mangoes collected directly from orchards and delivered to your doorstep.' WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';

UPDATE products SET description_bn = 'মিষ্টি ও সুগন্ধি ল্যাংড়া আম। ল্যাংড়া আম বাংলাদেশের অন্যতম জনপ্রিয় আমের জাত। এই আমের বিশেষত্ব হলো এর অনন্য মিষ্টি স্বাদ এবং মনমাতানো সুগন্ধ। সম্পূর্ণ প্রাকৃতিকভাবে পাকানো, কোনো রাসায়নিক দ্রব্য ব্যবহার করা হয়নি। তাজা অবস্থায় সরাসরি বাগান থেকে সংগ্রহ করে যত্নসহকারে প্যাকেজিং করে পাঠানো হয়।', description = 'Sweet and aromatic Langra mangoes. Langra is one of the most popular mango varieties in Bangladesh. The specialty of this mango is its unique sweet taste and captivating aroma. Completely naturally ripened, no chemicals used. Collected fresh from orchards and carefully packaged for delivery.' WHERE id = '4945f66e-99a9-48cb-bba9-3c897c192f96';

-- ---------------------------------------------------------------------
-- STEP 03/68  (20260404071259)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 04/68  (20260404071734)
-- ---------------------------------------------------------------------
-- Rename Himsagar to Lychee
UPDATE products SET 
  name = 'Rajshahi Lychee',
  name_bn = 'রাজশাহীর লিচি',
  description = 'Rajshahi is famous for producing the finest lychees in Bangladesh. Our fresh Rajshahi lychees are handpicked at peak ripeness, offering an incredibly sweet and juicy flavor. Each fruit is carefully selected to ensure the best quality, bringing the authentic taste of Rajshahi orchards directly to your home.',
  description_bn = 'রাজশাহী বাংলাদেশের সবচেয়ে সুস্বাদু লিচির জন্য বিখ্যাত। আমাদের তাজা রাজশাহীর লিচি পরিপূর্ণ পাকা অবস্থায় হাতে বাছাই করা হয়, যা অবিশ্বাস্য রকম মিষ্টি ও রসালো স্বাদ দেয়। প্রতিটি ফল সর্বোচ্চ মান নিশ্চিত করে যত্নের সাথে বাছাই করা হয়, রাজশাহীর বাগানের খাঁটি স্বাদ সরাসরি আপনার ঘরে পৌঁছে দেয়।'
WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';

-- Make all products featured so they show in homepage
UPDATE products SET is_featured = true WHERE is_featured = false;

-- ---------------------------------------------------------------------
-- STEP 05/68  (20260404071852)
-- ---------------------------------------------------------------------
UPDATE products SET image_url = '/images/sundarbans-honey.jpg', images = ARRAY['/images/sundarbans-honey.jpg'] WHERE id = '047c51ce-b371-487d-89df-ecd197da1a31';
UPDATE products SET image_url = '/images/ajwa-dates.jpg', images = ARRAY['/images/ajwa-dates.jpg'] WHERE id = '436dd866-4f7f-489d-bd39-15c7de44cabf';
UPDATE products SET image_url = '/images/coconut-oil.jpg', images = ARRAY['/images/coconut-oil.jpg'] WHERE id = 'df226638-26b1-4be1-a67b-a4dc3cc44b78';
UPDATE products SET image_url = '/images/dried-fish.jpg', images = ARRAY['/images/dried-fish.jpg'] WHERE id = '5688fe4d-518d-429d-a3df-7d98354b4043';

-- ---------------------------------------------------------------------
-- STEP 06/68  (20260406082449)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 07/68  (20260406084019)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 08/68  (20260409160516)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 09/68  (20260409161243)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 10/68  (20260409194332)
-- ---------------------------------------------------------------------
-- Add Pathao tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pathao_consignment_id text,
  ADD COLUMN IF NOT EXISTS pathao_order_status text,
  ADD COLUMN IF NOT EXISTS pathao_tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders(pathao_consignment_id) WHERE pathao_consignment_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- STEP 11/68  (20260410095359)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 12/68  (20260410101209)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 13/68  (20260410102350)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 14/68  (20260410105536)
-- ---------------------------------------------------------------------
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS show_text_overlay boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------
-- STEP 15/68  (20260421053532)
-- ---------------------------------------------------------------------
-- Wipe old mango data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM banners;

-- Insert new categories
INSERT INTO categories (name, name_bn, sort_order, image_url) VALUES
('Electronics', 'ইলেকট্রনিক্স', 1, 'https://images.unsplash.com/photo-1512499617640-c2f999098c01?w=600&q=80'),
('Home Appliances', 'হোম অ্যাপ্লায়েন্স', 2, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'),
('Bicycles & Vehicles', 'সাইকেল ও যানবাহন', 3, 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&q=80');

-- Insert new products
WITH cat AS (
  SELECT id, name FROM categories
)
INSERT INTO products (name, name_bn, description, description_bn, price, compare_price, image_url, images, category_id, is_active, is_featured, stock, unit, weight)
VALUES
-- Electronics
('Samsung Galaxy A55 5G', 'স্যামসাং গ্যালাক্সি A55 5G', 'Samsung Galaxy A55 5G with 8GB RAM, 128GB storage, 50MP triple camera and 5000mAh battery.', 'স্যামসাং গ্যালাক্সি A55 5G - ৮GB RAM, ১২৮GB স্টোরেজ, ৫০MP ক্যামেরা ও ৫০০০mAh ব্যাটারি।', 48999, 54999, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'], (SELECT id FROM cat WHERE name='Electronics'), true, true, 25, 'piece', '200g'),
('iPhone 15 128GB', 'আইফোন ১৫ ১২৮GB', 'Apple iPhone 15 with A16 Bionic chip, 48MP main camera, USB-C and Dynamic Island.', 'অ্যাপল আইফোন ১৫ - A16 Bionic চিপ, ৪৮MP ক্যামেরা, USB-C ও Dynamic Island।', 134999, 144999, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80'], (SELECT id FROM cat WHERE name='Electronics'), true, true, 10, 'piece', '180g'),
('HP Pavilion 15 Laptop', 'এইচপি প্যাভিলিয়ন ১৫ ল্যাপটপ', '15.6" FHD, Intel Core i5 13th Gen, 16GB RAM, 512GB SSD, Windows 11.', '১৫.৬" FHD ডিসপ্লে, Intel Core i5 13th Gen, ১৬GB RAM, ৫১২GB SSD, উইন্ডোজ ১১।', 89999, 99999, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'], (SELECT id FROM cat WHERE name='Electronics'), true, true, 15, 'piece', '1.75kg'),
('Sony 55" 4K Smart TV', 'সনি ৫৫" 4K স্মার্ট টিভি', 'Sony Bravia 55 inch 4K UHD Smart Android TV with Dolby Vision & Atmos.', 'সনি ব্রাভিয়া ৫৫ ইঞ্চি 4K UHD স্মার্ট অ্যান্ড্রয়েড টিভি, Dolby Vision ও Atmos সহ।', 79999, 89999, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'], (SELECT id FROM cat WHERE name='Electronics'), true, false, 8, 'piece', '15kg'),

-- Home Appliances
('Walton 240L Refrigerator', 'ওয়ালটন ২৪০L ফ্রিজ', 'Walton 240L double-door refrigerator with inverter compressor and 12-year warranty.', 'ওয়ালটন ২৪০L ডাবল-ডোর ফ্রিজ, ইনভার্টার কম্প্রেসর ও ১২ বছরের ওয়ারেন্টি।', 38500, 42000, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80'], (SELECT id FROM cat WHERE name='Home Appliances'), true, true, 12, 'piece', '55kg'),
('Gree 1.5 Ton Inverter AC', 'গ্রি ১.৫ টন ইনভার্টার এসি', 'Gree 1.5 Ton split inverter AC with 5-star rating, eco-friendly R32 gas.', 'গ্রি ১.৫ টন স্প্লিট ইনভার্টার এসি, ৫-স্টার রেটিং, R32 গ্যাস।', 65999, 72000, 'https://images.unsplash.com/photo-1631545308456-15ee7f55de4f?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1631545308456-15ee7f55de4f?w=800&q=80'], (SELECT id FROM cat WHERE name='Home Appliances'), true, true, 10, 'piece', '45kg'),
('LG 8kg Washing Machine', 'এলজি ৮কেজি ওয়াশিং মেশিন', 'LG 8kg fully-automatic front-load washing machine with AI Direct Drive.', 'এলজি ৮কেজি ফুল-অটো ফ্রন্ট লোড ওয়াশিং মেশিন, AI Direct Drive সহ।', 54999, 59999, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80'], (SELECT id FROM cat WHERE name='Home Appliances'), true, false, 7, 'piece', '60kg'),
('Panasonic Microwave Oven 25L', 'প্যানাসনিক মাইক্রোওয়েভ ২৫L', 'Panasonic 25L convection microwave oven with auto-cook menu.', 'প্যানাসনিক ২৫L কনভেকশন মাইক্রোওয়েভ ওভেন, অটো-কুক মেনু সহ।', 17500, 19999, 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80'], (SELECT id FROM cat WHERE name='Home Appliances'), true, false, 18, 'piece', '15kg'),

-- Bicycles & Vehicles
('Duranta Allure 26" Bicycle', 'দুরন্ত অ্যালুর ২৬" সাইকেল', 'Duranta Allure 26 inch single-speed bicycle, sturdy steel frame.', 'দুরন্ত অ্যালুর ২৬ ইঞ্চি সিঙ্গেল-স্পিড সাইকেল, মজবুত স্টিল ফ্রেম।', 9500, 11000, 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80'], (SELECT id FROM cat WHERE name='Bicycles & Vehicles'), true, true, 30, 'piece', '14kg'),
('Veloce Mountain Bike 21-Speed', 'ভেলোস মাউন্টেন বাইক ২১-স্পিড', '21-speed mountain bike with shock absorbers and disc brakes.', '২১-স্পিড মাউন্টেন বাইক, শক অ্যাবজরবার ও ডিস্ক ব্রেক সহ।', 16500, 19000, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80'], (SELECT id FROM cat WHERE name='Bicycles & Vehicles'), true, true, 20, 'piece', '15kg'),
('Kids Bicycle 16" Pink', 'কিডস সাইকেল ১৬" পিংক', 'Kids 16-inch bicycle with training wheels for ages 4-7.', 'বাচ্চাদের ১৬ ইঞ্চি সাইকেল, ট্রেনিং হুইল সহ (৪-৭ বছর)।', 5800, 6500, 'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=800&q=80'], (SELECT id FROM cat WHERE name='Bicycles & Vehicles'), true, false, 25, 'piece', '8kg'),
('Electric Scooter Pro', 'ইলেকট্রিক স্কুটার প্রো', 'Foldable electric scooter, 25km range, 25km/h top speed.', 'ফোল্ডেবল ইলেকট্রিক স্কুটার, ২৫কিমি রেঞ্জ, ২৫কিমি/ঘ. গতি।', 32999, 38000, 'https://images.unsplash.com/photo-1604868189265-219ba7bf7ea3?w=600&q=80', ARRAY['https://images.unsplash.com/photo-1604868189265-219ba7bf7ea3?w=800&q=80'], (SELECT id FROM cat WHERE name='Bicycles & Vehicles'), true, true, 8, 'piece', '12kg');

-- Insert new banners
INSERT INTO banners (title, subtitle, cta_text, cta_link, image_url, sort_order, is_active, show_text_overlay) VALUES
('Surzo Shop - Your One Stop Store', 'ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল — সেরা দামে', 'এখনই কিনুন', '/products', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80', 1, true, true),
('Big Electronics Sale', 'স্মার্টফোন ও ল্যাপটপে ২০% পর্যন্ত ছাড়', 'অফার দেখুন', '/products?category=Electronics', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=80', 2, true, true);

-- Update site settings
UPDATE site_settings SET value = '+880 1700-000000' WHERE key = 'footer_phone';
UPDATE site_settings SET value = 'info@surzoshop.com' WHERE key = 'footer_email';
UPDATE site_settings SET value = 'ঢাকা, বাংলাদেশ' WHERE key = 'footer_location';
UPDATE site_settings SET value = '© {year} Surzo Shop — সেরা পণ্য, সেরা দামে। সর্বস্বত্ব সংরক্ষিত।' WHERE key = 'footer_copyright';

-- ---------------------------------------------------------------------
-- STEP 16/68  (20260421113215)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
INSERT INTO public.site_settings (key, value, label)
SELECT 'footer_location', 'আশুরন্দ বাজার, সাপাহার, নওগাঁ', 'ঠিকানা'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'footer_location');

-- ---------------------------------------------------------------------
-- STEP 17/68  (20260421114235)
-- ---------------------------------------------------------------------
CREATE TABLE public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_image text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  location text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active reviews" ON public.customer_reviews
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all reviews" ON public.customer_reviews
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert reviews" ON public.customer_reviews
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reviews" ON public.customer_reviews
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reviews" ON public.customer_reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON public.customer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.customer_reviews (customer_name, customer_image, rating, review_text, location, sort_order) VALUES
  ('রহিম উদ্দিন', 'https://i.pravatar.cc/150?img=12', 5, 'সাপাহার আম এর মান অসাধারণ! একদম গাছ পাকা মিষ্টি আম পেয়েছি। delivery ও খুব দ্রুত ছিল। পরিবারের সবাই খুব খুশি।', 'ঢাকা', 1),
  ('ফাতেমা বেগম', 'https://i.pravatar.cc/150?img=45', 5, 'এত ভালো আম আগে কখনো খাইনি। প্যাকেজিং একদম perfect ছিল, কোনো আম নষ্ট হয়নি। অবশ্যই আবার অর্ডার করব।', 'চট্টগ্রাম', 2),
  ('করিম শেখ', 'https://i.pravatar.cc/150?img=33', 5, 'রাজশাহীর লিচু একদম তাজা এবং মিষ্টি। দাম ও যুক্তিসঙ্গত। Customer service অসাধারণ। Highly recommended!', 'সিলেট', 3),
  ('সাবরিনা আক্তার', 'https://i.pravatar.cc/150?img=47', 5, 'আমার পরিবারের জন্য নিয়মিত আম অর্ডার করি। প্রতিবারই মান অপরিবর্তিত। সাপাহার মাঙ্গো এর উপর সম্পূর্ণ ভরসা।', 'খুলনা', 4),
  ('জাহিদ হাসান', 'https://i.pravatar.cc/150?img=15', 5, 'ফ্রেশ আম, সঠিক ওজন এবং সময়মতো ডেলিভারি — সব কিছুই perfect! ধন্যবাদ Sapahar Mango টিমকে।', 'রাজশাহী', 5),
  ('নাসরিন সুলতানা', 'https://i.pravatar.cc/150?img=49', 5, 'অফিসের colleagues দের জন্য gift হিসেবে অর্ডার করেছিলাম। সবাই প্রশংসা করেছে। অসাধারণ quality!', 'বরিশাল', 6);

-- ---------------------------------------------------------------------
-- STEP 18/68  (20260421115257)
-- ---------------------------------------------------------------------
DELETE FROM public.customer_reviews;

INSERT INTO public.customer_reviews (customer_name, customer_image, rating, review_text, location, sort_order) VALUES
  ('রহিম উদ্দিন', 'https://i.pravatar.cc/150?img=12', 5, 'সাপাহারের আম্রপালি আম একদম গাছ পাকা ও মিষ্টি! এত ভালো মানের আম ঢাকায় বসে পাওয়া সত্যিই অসাধারণ। প্যাকেজিং perfect ছিল।', 'ঢাকা', 1),
  ('ফাতেমা বেগম', 'https://i.pravatar.cc/150?img=45', 5, 'হিমসাগর আম অর্ডার করেছিলাম পরিবারের জন্য। সবাই খুব খুশি! সঠিক ওজন, ফ্রেশ এবং সময়মতো ডেলিভারি। অবশ্যই আবার অর্ডার করব।', 'চট্টগ্রাম', 2),
  ('করিম শেখ', 'https://i.pravatar.cc/150?img=33', 5, 'রাজশাহীর বোম্বাই লিচু একদম তাজা পেয়েছি — রস ও মিষ্টি পরিপূর্ণ। দাম যুক্তিসঙ্গত এবং customer service অসাধারণ। Highly recommended!', 'সিলেট', 3),
  ('সাবরিনা আক্তার', 'https://i.pravatar.cc/150?img=47', 5, 'প্রতি মৌসুমে Sapahar Mango থেকেই আম নিই। ল্যাংড়া, হিমসাগর, ফজলি — সব আমেরই মান অপরিবর্তিত। সম্পূর্ণ ভরসা রাখি।', 'খুলনা', 4),
  ('জাহিদ হাসান', 'https://i.pravatar.cc/150?img=15', 5, 'আশ্বিনা আম এত মিষ্টি ও সুগন্ধযুক্ত হবে কল্পনাও করিনি! ১০ কেজির box একদম safely পৌঁছেছে, একটাও আম নষ্ট নয়। ধন্যবাদ টিমকে।', 'রাজশাহী', 5),
  ('নাসরিন সুলতানা', 'https://i.pravatar.cc/150?img=49', 5, 'অফিসের colleagues দের জন্য gift হিসেবে আম ও লিচুর combo box পাঠিয়েছিলাম। সবাই quality দেখে অবাক! Premium packaging — অসাধারণ।', 'বরিশাল', 6);

-- ---------------------------------------------------------------------
-- STEP 19/68  (20260421115531)
-- ---------------------------------------------------------------------
DELETE FROM public.customer_reviews;

INSERT INTO public.customer_reviews (customer_name, customer_image, rating, review_text, location, sort_order) VALUES
  ('রহিম উদ্দিন', 'https://i.pravatar.cc/150?img=12', 5, 'iPhone 15 ১২৮GB একদম original ও sealed pack পেয়েছি! Warranty card সহ সব কিছু perfect। দাম ও বাজারের তুলনায় কম। অসাধারণ service!', 'ঢাকা', 1),
  ('ফাতেমা বেগম', 'https://i.pravatar.cc/150?img=45', 5, 'Samsung Galaxy A55 5G অর্ডার করেছিলাম — মাত্র ২ দিনে delivery পেয়েছি। Phone এর performance দারুণ, camera quality ও excellent। পুরোপুরি সন্তুষ্ট।', 'চট্টগ্রাম', 2),
  ('করিম শেখ', 'https://i.pravatar.cc/150?img=33', 5, 'HP Pavilion 15 Laptop নিয়েছি office work এর জন্য। Specifications একদম যেমন বলেছে, তেমনই পেয়েছি। Customer support ও খুব helpful। Highly recommended!', 'সিলেট', 3),
  ('সাবরিনা আক্তার', 'https://i.pravatar.cc/150?img=47', 5, 'Gree 1.5 টন Inverter AC কিনেছি — installation team ও সাহায্য করেছে। Cooling অসাধারণ, electricity bill ও কম আসছে। ভরসা রাখার মতো shop।', 'খুলনা', 4),
  ('জাহিদ হাসান', 'https://i.pravatar.cc/150?img=15', 5, 'Duranta Allure 26" সাইকেল ছেলের জন্য নিয়েছি। Build quality দুর্দান্ত, প্যাকেজিং safely পৌঁছেছে। ছেলে খুব খুশি — ধন্যবাদ পুরো টিমকে!', 'রাজশাহী', 5),
  ('নাসরিন সুলতানা', 'https://i.pravatar.cc/150?img=49', 5, 'Sony 55" 4K Smart TV ও Walton Fridge দুটোই একসাথে অর্ডার করেছিলাম। সব কিছু genuine ও warranty সহ। Premium service — অবশ্যই আবার কিনব।', 'বরিশাল', 6);

-- ---------------------------------------------------------------------
-- STEP 20/68  (20260422101234)
-- ---------------------------------------------------------------------
-- Allow anonymous and authenticated users to insert/update their abandoned checkout records
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;

CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ---------------------------------------------------------------------
-- STEP 21/68  (20260422105229)
-- ---------------------------------------------------------------------
-- Saved addresses for logged-in customers (Daraz-style address book)
CREATE TABLE public.saved_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'বাসা',
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
ON public.saved_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON public.saved_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON public.saved_addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON public.saved_addresses FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
ON public.saved_addresses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);

CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON public.saved_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 22/68  (20260422122049)
-- ---------------------------------------------------------------------
-- Add grade column to products (A, B, C, D — nullable so existing products unaffected)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D'));

-- Add a flag to categories so admin can mark which categories need a weight field
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS requires_weight BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- STEP 23/68  (20260422123147)
-- ---------------------------------------------------------------------
-- Add approval workflow columns to customer_reviews
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS submitted_by_customer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Mark all existing reviews as approved so they keep showing
UPDATE public.customer_reviews SET status = 'approved' WHERE status = 'pending';

-- Drop old public SELECT policy and recreate with status filter
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.customer_reviews;

CREATE POLICY "Anyone can view approved active reviews"
  ON public.customer_reviews
  FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Allow anyone (guest or authenticated) to submit a new review
CREATE POLICY "Anyone can submit reviews"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND submitted_by_customer = true
    AND is_active = false
  );

-- Index for fast admin filtering by status
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);

-- ---------------------------------------------------------------------
-- STEP 24/68  (20260422124514)
-- ---------------------------------------------------------------------
-- Add product_id and review_images to customer_reviews so reviews can be tied to specific products
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS product_id uuid NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS review_images text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_id
  ON public.customer_reviews(product_id);

-- Allow public uploads of review images into the existing product-images bucket under "reviews/" prefix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can upload review images'
  ) THEN
    CREATE POLICY "Anyone can upload review images"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'reviews');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read product images'
  ) THEN
    CREATE POLICY "Public can read product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- STEP 25/68  (20260423011046)
-- ---------------------------------------------------------------------
UPDATE site_settings SET value = '+880 1779-80168' WHERE key = 'footer_phone';
UPDATE site_settings SET value = 'surzoshop@gmail.com' WHERE key = 'footer_email';
UPDATE site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
UPDATE site_settings SET value = '© {year} Surzo Shop — স্বল্প মূল্যে সেরা পণ্য। সর্বস্বত্ব সংরক্ষিত।' WHERE key = 'footer_copyright';

INSERT INTO site_settings (key, value, label) VALUES
  ('footer_instagram', '#', 'ইনস্টাগ্রাম লিংক'),
  ('footer_youtube', '#', 'ইউটিউব লিংক')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 26/68  (20260423105946)
-- ---------------------------------------------------------------------
-- ============================================
-- AUTO STOCK MANAGEMENT SYSTEM
-- ============================================

-- 1. Function: Decrement stock when order item is inserted
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
  product_name_val text;
BEGIN
  -- Skip if no product_id (manual/custom items)
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock the product row to prevent race conditions
  SELECT stock, name_bn INTO current_stock, product_name_val
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- If product not found, allow (it might be deleted)
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Check if enough stock available
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'দুঃখিত! "%" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান স্টক: %, অর্ডার পরিমাণ: %',
      product_name_val, current_stock, NEW.quantity
      USING ERRCODE = 'P0001';
  END IF;

  -- Decrement stock atomically
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

-- 2. Function: Restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes TO 'cancelled' (not from cancelled)
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- Re-deduct if order is uncancelled (status moves away from 'cancelled')
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock - oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Function: Restore stock if order_items are deleted (e.g., order deleted)
CREATE OR REPLACE FUNCTION public.restore_stock_on_item_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_status text;
BEGIN
  IF OLD.product_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Only restore if the parent order wasn't already cancelled (which already restored)
  SELECT status INTO parent_status FROM public.orders WHERE id = OLD.order_id;

  IF parent_status IS NULL OR parent_status <> 'cancelled' THEN
    UPDATE public.products
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$$;

-- 4. Triggers
DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_stock_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

DROP TRIGGER IF EXISTS trg_restore_stock_on_order_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

DROP TRIGGER IF EXISTS trg_restore_stock_on_item_delete ON public.order_items;
CREATE TRIGGER trg_restore_stock_on_item_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_item_delete();

-- ---------------------------------------------------------------------
-- STEP 27/68  (20260424105714)
-- ---------------------------------------------------------------------
-- ============================================
-- Landing Pages Table
-- ============================================
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- URL & Status
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
  
  -- Basic Info
  title TEXT NOT NULL,
  meta_description TEXT,
  
  -- Theme
  theme_preset TEXT NOT NULL DEFAULT 'mango_yellow',
  
  -- Hero Section
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'এখনই অর্ডার করুন',
  
  -- Products (array of { product_id, special_price?, position })
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Bundle pricing
  enable_bundle BOOLEAN NOT NULL DEFAULT false,
  bundle_discount_percent NUMERIC DEFAULT 0,
  bundle_label TEXT,
  
  -- Content sections
  bullet_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  long_description TEXT,
  faq_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  trust_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Reviews to feature (array of customer_review IDs)
  featured_review_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Conversion elements
  countdown_enabled BOOLEAN NOT NULL DEFAULT false,
  countdown_end_at TIMESTAMPTZ,
  stock_counter_enabled BOOLEAN NOT NULL DEFAULT false,
  stock_counter_value INTEGER,
  
  -- Tracking
  facebook_pixel_id TEXT,
  
  -- Analytics counters
  view_count INTEGER NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  
  -- Schedule
  publish_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast slug lookup
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view published pages within schedule
CREATE POLICY "Public can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (
  status = 'published'
  AND (publish_at IS NULL OR publish_at <= now())
  AND (expire_at IS NULL OR expire_at > now())
);

-- RLS: Admins can view all
CREATE POLICY "Admins can view all landing pages"
ON public.landing_pages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can insert
CREATE POLICY "Admins can insert landing pages"
ON public.landing_pages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can update
CREATE POLICY "Admins can update landing pages"
ON public.landing_pages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can delete
CREATE POLICY "Admins can delete landing pages"
ON public.landing_pages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Add landing_page_id to orders for attribution
-- ============================================
ALTER TABLE public.orders
ADD COLUMN landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_landing_page_id ON public.orders(landing_page_id);

-- ============================================
-- Public function to increment view count safely
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_landing_page_view(_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.landing_pages
  SET view_count = view_count + 1
  WHERE slug = _slug
    AND status = 'published'
    AND (publish_at IS NULL OR publish_at <= now())
    AND (expire_at IS NULL OR expire_at > now());
END;
$$;

-- Allow anonymous and authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.increment_landing_page_view(TEXT) TO anon, authenticated;

-- ============================================
-- Function to increment order count + revenue when order completes
-- ============================================
CREATE OR REPLACE FUNCTION public.update_landing_page_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On new order with landing_page_id
  IF TG_OP = 'INSERT' AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = order_count + 1,
        total_revenue = total_revenue + COALESCE(NEW.total, 0)
    WHERE id = NEW.landing_page_id;
  END IF;
  
  -- If order is cancelled, decrement
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = GREATEST(order_count - 1, 0),
        total_revenue = GREATEST(total_revenue - COALESCE(NEW.total, 0), 0)
    WHERE id = NEW.landing_page_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER landing_page_order_stats
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_landing_page_stats();

-- ---------------------------------------------------------------------
-- STEP 28/68  (20260424113524)
-- ---------------------------------------------------------------------
-- Email Templates Table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view templates" ON public.email_templates
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert templates" ON public.email_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update templates" ON public.email_templates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete templates" ON public.email_templates
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role) AND is_system = false);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email Logs Table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body text,
  template_key text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  gmail_message_id text,
  related_order_id uuid,
  related_user_id uuid,
  sent_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete email logs" ON public.email_logs
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_order ON public.email_logs(related_order_id) WHERE related_order_id IS NOT NULL;

-- Seed 5 bilingual professional email templates
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_system) VALUES
('welcome_signup', 'Welcome / স্বাগতম', 'নতুন signup এর জন্য welcome email', 'স্বাগতম {{site_name}} পরিবারে! 🎉',
'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">স্বাগতম! 🎉</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:16px;">Welcome to {{site_name}}</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;color:#0f172a;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">আপনাকে আমাদের পরিবারে স্বাগতম জানাচ্ছি! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন থেকে আপনি আমাদের সকল সেবা উপভোগ করতে পারবেন।</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;">Dear {{customer_name}}, welcome to our family! Your account has been created successfully. You can now enjoy all our services.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:16px 20px;border-radius:8px;">
<p style="margin:0 0 8px;font-weight:600;color:#0f766e;">✨ আপনি পাবেন:</p>
<ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
<li>সেরা মানের পণ্য সরাসরি আপনার দোরগোড়ায়</li>
<li>দ্রুত ডেলিভারি সারা বাংলাদেশে</li>
<li>বিশেষ ছাড় ও অফার</li>
<li>২৪/৭ কাস্টমার সাপোর্ট</li>
</ul></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);border-radius:8px;">
<a href="https://{{site_url}}/products" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">এখনই কেনাকাটা শুরু করুন →</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন: <a href="mailto:{{company_email}}" style="color:#0d9488;text-decoration:none;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}} — সর্বস্বত্ব সংরক্ষিত</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_confirmation', 'Order Confirmation / অর্ডার নিশ্চিতকরণ', 'অর্ডার দেয়ার সাথে সাথে পাঠানো হয়', '✅ আপনার অর্ডার পেয়েছি — {{order_code}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 30px;text-align:center;">
<div style="background:#ffffff;width:64px;height:64px;border-radius:50%;display:inline-block;line-height:64px;font-size:32px;margin-bottom:12px;">✅</div>
<h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">অর্ডার নিশ্চিত হয়েছে!</h1>
<p style="color:#d1fae5;margin:8px 0 0;font-size:15px;">Order Confirmed Successfully</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 8px;">আসসালামু আলাইকুম <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারটি আমরা সফলভাবে পেয়েছি। নিচে আপনার অর্ডারের সম্পূর্ণ বিবরণ দেওয়া হলো।</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:12px;padding:20px;margin:0 0 24px;"><tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0;font-size:22px;font-weight:700;color:#0f766e;">{{order_code}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">📦 আপনার পণ্য</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:2px solid #e2e8f0;padding-top:16px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি চার্জ:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:12px 0 6px;font-size:17px;font-weight:700;border-top:1px solid #e2e8f0;">মোট:</td><td align="right" style="padding:12px 0 6px;font-size:20px;font-weight:700;color:#0d9488;border-top:1px solid #e2e8f0;">৳ {{order_total}}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0 0 6px;font-weight:600;color:#92400e;">🚚 ডেলিভারি ঠিকানা</p>
<p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">{{shipping_address}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে। ধন্যবাদ আমাদের উপর আস্থা রাখার জন্য! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 প্রশ্ন থাকলে: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('first_order_thanks', 'First Order Thanks / প্রথম অর্ডার ধন্যবাদ', 'প্রথমবার অর্ডারকারী customer-কে বিশেষ ধন্যবাদ', '🎁 ধন্যবাদ আপনার প্রথম অর্ডারের জন্য, {{customer_name}}!',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:50px 30px;text-align:center;">
<div style="font-size:56px;margin-bottom:8px;">🎁</div>
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">অসংখ্য ধন্যবাদ!</h1>
<p style="color:#fef3c7;margin:8px 0 0;font-size:16px;">Thank You for Your First Order</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.8;color:#475569;margin:0 0 16px;">আপনার <strong>প্রথম অর্ডারটি</strong> আমাদের জন্য অনেক বিশেষ! আপনি আমাদের উপর বিশ্বাস রেখেছেন বলে আমরা কৃতজ্ঞ। 💚</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;font-style:italic;">Your first order means a lot to us. Thank you for trusting {{site_name}}!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7,#fed7aa);border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 8px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:600;">আপনার অর্ডার</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#9a3412;">{{order_code}}</p>
<p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#7c2d12;">৳ {{order_total}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">🎉 আপনার জন্য বিশেষ সুবিধা:</h3>
<ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
<li>পরের অর্ডারে <strong>বিশেষ ছাড়</strong> পেতে আমাদের সাথে থাকুন</li>
<li>নতুন পণ্যের আপডেট সবার আগে জানুন</li>
<li>VIP কাস্টমার হিসেবে অগ্রাধিকার সেবা</li>
</ul>
<p style="font-size:14px;line-height:1.7;color:#475569;margin:16px 0 0;">আপনার ফিডব্যাক আমাদের কাছে অমূল্য। অর্ডার পেয়ে আপনার অভিজ্ঞতা আমাদের জানাতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">💚 আপনার বিশ্বাসের জন্য আবারও ধন্যবাদ</p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_status_update', 'Order Status Update / অর্ডার স্ট্যাটাস', 'Admin status পরিবর্তন করলে পাঠানো হয়', '📦 আপনার অর্ডার {{order_code}} এখন: {{order_status}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<div style="font-size:48px;margin-bottom:8px;">📦</div>
<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">অর্ডার স্ট্যাটাস আপডেট</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:14px;">Order Status Update</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারের স্ট্যাটাস পরিবর্তন হয়েছে। বিস্তারিত নিচে দেওয়া হলো:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:2px solid #14b8a6;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#134e4a;">{{order_code}}</p>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">বর্তমান স্ট্যাটাস</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#0d9488;text-transform:capitalize;">{{order_status}}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-left:4px solid #facc15;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">💬 <strong>বার্তা:</strong> {{status_message}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না। আপনার পাশে আছি! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 যোগাযোগ: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('custom_admin', 'Custom Admin Email / কাস্টম ইমেইল', 'Admin থেকে customer-কে কাস্টম মেসেজ', '{{custom_subject}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:32px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{site_name}}</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 20px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<div style="font-size:15px;line-height:1.8;color:#334155;">{{custom_message}}</div>
<p style="font-size:14px;color:#64748b;margin:32px 0 0;">শুভকামনায়,<br/><strong>{{site_name}} টিম</strong></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true);

-- Default site_settings for email branding
INSERT INTO public.site_settings (key, value, label) VALUES
  ('company_name', 'Sapahar Mango', 'কোম্পানির নাম'),
  ('company_email', 'info@sapaharmango.com', 'কোম্পানির ইমেইল')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 29/68  (20260425124149)
-- ---------------------------------------------------------------------
-- Add admin notification email setting
INSERT INTO public.site_settings (key, value, label)
VALUES ('admin_notification_email', 'surzoshop@gmail.com', 'Admin Order Notification Email')
ON CONFLICT (key) DO NOTHING;

-- Add new_order_admin email template
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES (
  'new_order_admin',
  'New Order Admin Alert / নতুন অর্ডার এডমিন এলার্ট',
  'Sent to admin when a new order is placed',
  '🔔 নতুন অর্ডার #{{order_code}} - ৳{{order_total}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:24px;color:#fff;">
<h1 style="margin:0;font-size:22px;">🔔 নতুন অর্ডার এসেছে!</h1>
<p style="margin:6px 0 0;opacity:0.9;font-size:14px;">New Order Notification — {{site_name}}</p>
</td></tr>
<tr><td style="padding:24px;">
<div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:6px;margin-bottom:20px;">
<p style="margin:0;font-size:13px;color:#475569;">অর্ডার নম্বর / Order #</p>
<p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0891b2;">{{order_code}}</p>
</div>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">গ্রাহকের তথ্য / Customer Details</h3>
<table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#334155;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="border-bottom:1px solid #e2e8f0;width:140px;color:#64748b;">নাম / Name</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_name}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ফোন / Phone</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_phone}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ইমেইল / Email</td><td style="border-bottom:1px solid #e2e8f0;">{{customer_email}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;vertical-align:top;">ঠিকানা / Address</td><td style="border-bottom:1px solid #e2e8f0;">{{shipping_address}}</td></tr>
<tr><td style="color:#64748b;">পেমেন্ট / Payment</td><td style="font-weight:600;text-transform:uppercase;">{{payment_method}}</td></tr>
</table>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">পণ্য / Items</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল / Subtotal</td><td align="right" style="padding:6px 0;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি / Shipping</td><td align="right" style="padding:6px 0;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">মোট / Total</td><td align="right" style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">৳ {{order_total}}</td></tr>
</table>
<div style="text-align:center;margin-top:24px;">
<a href="https://{{site_url}}/admin/orders" style="display:inline-block;background:#0891b2;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার দেখুন / View Order</a>
</div>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:12px;">
এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে — {{site_name}} Admin System
</td></tr>
</table>
</td></tr></table></body></html>',
  true,
  true
)
ON CONFLICT (template_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 30/68  (20260425125036)
-- ---------------------------------------------------------------------
-- Add 5 new ready-to-use email templates for admin

INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES
-- 1. Shipping notification
(
  'order_shipped',
  'Order Shipped / অর্ডার পাঠানো হয়েছে',
  'Notify customer that order has been shipped via courier',
  '🚚 আপনার অর্ডার #{{order_code}} পাঠানো হয়েছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#fbbf24);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🚚 অর্ডার পাঠানো হয়েছে!</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your order is on the way</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">আপনার অর্ডার <strong style="color:#f59e0b;">#{{order_code}}</strong> কুরিয়ারে পাঠানো হয়েছে এবং খুব শীঘ্রই আপনার ঠিকানায় পৌঁছে যাবে। ইনশাআল্লাহ্‌।</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:6px;margin:20px 0;">
<p style="margin:0 0 6px;font-size:13px;color:#78350f;">ট্র্যাকিং নম্বর / Tracking ID</p>
<p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">{{tracking_id}}</p>
</div>
<p style="font-size:14px;color:#475569;line-height:1.7;">কুরিয়ার: <strong>{{courier_name}}</strong><br/>প্রত্যাশিত ডেলিভারি: <strong>{{delivery_date}}</strong></p>
<div style="text-align:center;margin:28px 0;">
<a href="{{tracking_url}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">ট্র্যাক করুন / Track Order</a>
</div>
<p style="font-size:13px;color:#94a3b8;text-align:center;margin:20px 0 0;">কোনো প্রশ্ন থাকলে যোগাযোগ করুন: {{company_email}}</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — তাজা ফলের নিশ্চয়তা
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 2. Order delivered
(
  'order_delivered',
  'Order Delivered / অর্ডার ডেলিভার হয়েছে',
  'Confirmation when order is successfully delivered',
  '✅ অর্ডার #{{order_code}} ডেলিভার সম্পন্ন — ধন্যবাদ!',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:36px;text-align:center;color:#fff;">
<div style="font-size:48px;margin-bottom:8px;">✅</div>
<h1 style="margin:0;font-size:24px;">ডেলিভারি সম্পন্ন!</h1>
<p style="margin:6px 0 0;opacity:0.95;">Order Delivered Successfully</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার অর্ডার <strong>#{{order_code}}</strong> সফলভাবে ডেলিভার হয়েছে। আমাদের সেবা পছন্দ হয়েছে কিনা জানাতে ভুলবেন না!</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:#166534;font-weight:600;">আপনার অভিজ্ঞতা শেয়ার করুন</p>
<a href="https://{{site_url}}/products" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">রিভিউ দিন / Leave a Review</a>
</div>
<p style="font-size:13px;color:#64748b;line-height:1.6;text-align:center;margin:20px 0 0;">আপনার ভরসায় আমরা কৃতজ্ঞ। আবার অর্ডার করতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — সাপাহারের সেরা আম
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 3. Abandoned cart recovery
(
  'abandoned_cart',
  'Abandoned Cart Recovery / কার্ট রিকভারি',
  'Remind customer about items left in cart',
  '🛒 আপনার কার্টে কিছু রয়ে গেছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fef9f3;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🛒 কিছু ভুলে গেছেন?</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your cart is waiting for you</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনি কিছু পছন্দের পণ্য কার্টে রেখে চলে গেছেন। এগুলো শেষ হওয়ার আগেই অর্ডার সম্পন্ন করুন!</p>
{{items_html}}
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px;border-radius:6px;margin:20px 0;">
<p style="margin:0;font-size:13px;color:#991b1b;">⚡ স্টক সীমিত — দ্রুত অর্ডার করুন</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/cart" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার সম্পন্ন করুন / Complete Order</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 4. Promo / Discount offer
(
  'promo_offer',
  'Promo Offer / বিশেষ অফার',
  'Send special discount or seasonal offer to customer',
  '🎁 বিশেষ অফার আপনার জন্য — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fdf4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#9333ea,#c026d3);padding:36px;text-align:center;color:#fff;">
<div style="font-size:42px;margin-bottom:8px;">🎁</div>
<h1 style="margin:0;font-size:26px;">{{offer_title}}</h1>
<p style="margin:8px 0 0;opacity:0.95;font-size:14px;">{{offer_subtitle}}</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">{{offer_body}}</p>
<div style="background:linear-gradient(135deg,#fdf4ff,#fae8ff);border:2px dashed #9333ea;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
<p style="margin:0 0 6px;font-size:13px;color:#6b21a8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">কুপন কোড</p>
<p style="margin:0;font-size:28px;font-weight:800;color:#9333ea;letter-spacing:3px;">{{coupon_code}}</p>
<p style="margin:10px 0 0;font-size:12px;color:#6b21a8;">মেয়াদ: {{expiry_date}}</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#9333ea;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">এখনই কিনুন / Shop Now</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 5. Review request
(
  'review_request',
  'Review Request / রিভিউ অনুরোধ',
  'Ask customer for a product review after delivery',
  '⭐ আপনার মতামত জানাতে ভুলবেন না — অর্ডার #{{order_code}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fffbeb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#eab308,#facc15);padding:36px;text-align:center;color:#0f172a;">
<div style="font-size:42px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
<h1 style="margin:0;font-size:24px;">আপনার রিভিউ দরকার!</h1>
<p style="margin:8px 0 0;opacity:0.85;">Share your experience</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার সাম্প্রতিক অর্ডার <strong>#{{order_code}}</strong> এর অভিজ্ঞতা কেমন ছিল? একটি সংক্ষিপ্ত রিভিউ দিয়ে অন্য গ্রাহকদেরও সাহায্য করুন।</p>
<div style="background:#fef3c7;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0;font-size:14px;color:#78350f;font-weight:600;">আপনার মতামত আমাদের কাছে অমূল্য</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#eab308;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">রিভিউ দিন / Write Review</a>
</div>
<p style="font-size:12px;color:#94a3b8;text-align:center;margin:16px 0 0;">এক মিনিটেরও কম সময় লাগবে</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
)
ON CONFLICT (template_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 31/68  (20260425164040)
-- ---------------------------------------------------------------------
-- Add cost_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- Inventory purchases table (records each stock purchase batch)
CREATE TABLE IF NOT EXISTS public.inventory_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  supplier_name text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory purchases"
ON public.inventory_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert inventory purchases"
ON public.inventory_purchases FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update inventory purchases"
ON public.inventory_purchases FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete inventory purchases"
ON public.inventory_purchases FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_inventory_purchases_updated_at
BEFORE UPDATE ON public.inventory_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business expenses table (general expenses: rent, marketing, transport, etc.)
CREATE TABLE IF NOT EXISTS public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view business expenses"
ON public.business_expenses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert business expenses"
ON public.business_expenses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update business expenses"
ON public.business_expenses FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete business expenses"
ON public.business_expenses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 32/68  (20260426021107)
-- ---------------------------------------------------------------------
-- Sample Landing Page 1: Smartphone Combo (3 products, full features)
INSERT INTO public.landing_pages (
  slug, status, title, meta_description, theme_preset,
  hero_headline, hero_subheadline, hero_image_url, cta_text,
  products, enable_bundle, bundle_discount_percent, bundle_label,
  bullet_points, long_description, faq_items, trust_badges,
  countdown_enabled, countdown_end_at,
  stock_counter_enabled, stock_counter_value
) VALUES (
  'smartphone-eid-combo',
  'draft',
  'ঈদ স্পেশাল স্মার্টফোন কম্বো অফার',
  'ঈদ উপলক্ষে ৩টি জনপ্রিয় স্মার্টফোন একসাথে — সর্বনিম্ন দামে! ক্যাশ অন ডেলিভারি, সারাদেশে।',
  'mango_yellow',
  '🎉 ঈদ স্পেশাল! ৩টি প্রিমিয়াম স্মার্টফোন — একসাথে বিশাল ছাড়ে',
  '১০০% অরিজিনাল • ১ বছরের ওয়ারেন্টি • সারাদেশে ফ্রি ডেলিভারি',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
  '🛒 এখনই অর্ডার করুন',
  '[
    {"product_id":"0d5614d3-adf7-40ad-a9f2-6e4bd47110fb","special_price":17500},
    {"product_id":"cfacc979-46dd-4206-aba4-0333c6fe2709","special_price":14900},
    {"product_id":"56f9d771-ba9e-40a0-91f4-ea4bc3b9c397","special_price":15000}
  ]'::jsonb,
  true, 10, 'মেগা কম্বো প্যাক',
  '[
    {"text":"১০০% অরিজিনাল ও ব্র্যান্ড নিউ স্মার্টফোন"},
    {"text":"১ বছরের অফিসিয়াল ওয়ারেন্টি"},
    {"text":"ফ্রি হোম ডেলিভারি — সারাদেশে"},
    {"text":"ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে পেমেন্ট"},
    {"text":"৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি"},
    {"text":"২৪/৭ কাস্টমার সাপোর্ট"}
  ]'::jsonb,
  E'এই বিশেষ ঈদ অফারে আমরা নিয়ে এসেছি ৩টি জনপ্রিয় স্মার্টফোনের কম্বো প্যাক — যেগুলো বাজারে সবচেয়ে বেশি বিক্রি হচ্ছে।\n\n✓ Vivo Y19s Pro (6/128GB) — দুর্দান্ত ক্যামেরা ও ব্যাটারি\n✓ Redmi A5 (6/128GB) — বাজেট-ফ্রেন্ডলি পাওয়ার হাউস\n✓ Realme Note 7o (4/128GB) — গেমিং এর জন্য পারফেক্ট\n\nএকসাথে কিনলে অতিরিক্ত ১০% ছাড় — পরিবার বা বন্ধুদের সাথে ভাগাভাগি করুন।\n\nসব ফোনই সম্পূর্ণ অরিজিনাল, ১ বছরের ওয়ারেন্টি সহ। অর্ডার দিন এখনই — স্টক সীমিত!',
  '[
    {"question":"ফোনগুলো কি অরিজিনাল?","answer":"হ্যাঁ, ১০০% অরিজিনাল ও ব্র্যান্ড নিউ। সব অফিসিয়াল ওয়ারেন্টি সহ আসে।"},
    {"question":"ডেলিভারি কতদিনে পাব?","answer":"ঢাকার ভিতরে ২৪ ঘণ্টায়, ঢাকার বাইরে ২-৩ কর্মদিবসে পেয়ে যাবেন।"},
    {"question":"পেমেন্ট কীভাবে করব?","answer":"ক্যাশ অন ডেলিভারি (COD) — পণ্য হাতে পেয়ে পেমেন্ট করতে পারবেন। বিকাশ/নগদেও দিতে পারেন।"},
    {"question":"যদি ফোন পছন্দ না হয়?","answer":"৭ দিনের মধ্যে রিপ্লেসমেন্ট/রিটার্নের সুযোগ আছে (শর্ত প্রযোজ্য)।"},
    {"question":"একসাথে কিনলে কত ছাড়?","answer":"৩টি ফোন একসাথে কিনলে ১০% অতিরিক্ত ছাড় — মেগা কম্বো প্যাক হিসেবে।"}
  ]'::jsonb,
  '[
    {"icon":"truck","label":"ক্যাশ অন ডেলিভারি"},
    {"icon":"shield","label":"১ বছরের ওয়ারেন্টি"},
    {"icon":"clock","label":"২৪-৭২ ঘণ্টায় ডেলিভারি"},
    {"icon":"check","label":"১০০% অরিজিনাল"},
    {"icon":"phone","label":"২৪/৭ সাপোর্ট"}
  ]'::jsonb,
  true, (now() + interval '7 days'),
  true, 25
);

-- Sample Landing Page 2: Premium Single Product (Samsung A23)
INSERT INTO public.landing_pages (
  slug, status, title, meta_description, theme_preset,
  hero_headline, hero_subheadline, hero_image_url, cta_text,
  products, enable_bundle,
  bullet_points, long_description, faq_items, trust_badges,
  countdown_enabled, stock_counter_enabled, stock_counter_value
) VALUES (
  'samsung-a23-premium',
  'draft',
  'Samsung Galaxy A23 — প্রিমিয়াম পারফরম্যান্স',
  'Samsung Galaxy A23 6/128GB — অরিজিনাল, অফিসিয়াল ওয়ারেন্টি, সর্বনিম্ন দামে।',
  'premium_dark',
  'Samsung Galaxy A23',
  'প্রিমিয়াম ডিজাইন। শক্তিশালী পারফরম্যান্স। এক্সক্লুসিভ অফারে।',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&q=80',
  '⚡ অর্ডার করুন এখনই',
  '[
    {"product_id":"319b7fb6-98e6-4772-8e08-15ec110dfe6b","special_price":25500}
  ]'::jsonb,
  false,
  '[
    {"text":"৬.৬ ইঞ্চি Full HD+ ডিসপ্লে"},
    {"text":"৫০ MP কোয়াড ক্যামেরা সিস্টেম"},
    {"text":"৬GB RAM + ১২৮GB ইন্টারনাল স্টোরেজ"},
    {"text":"৫০০০ mAh শক্তিশালী ব্যাটারি"},
    {"text":"২৫W ফাস্ট চার্জিং সাপোর্ট"},
    {"text":"১ বছরের অফিসিয়াল Samsung ওয়ারেন্টি"}
  ]'::jsonb,
  E'Samsung Galaxy A23 — যারা প্রিমিয়াম মানের ফোন কিন্তু সাশ্রয়ী দামে চান, তাদের জন্য পারফেক্ট চয়েস।\n\n✦ ক্যামেরা: ৫০ MP মেইন + আল্ট্রা-ওয়াইড + ম্যাক্রো + ডেপথ — প্রতিটি মুহূর্তের পারফেক্ট ছবি।\n✦ ডিসপ্লে: ৬.৬" Full HD+ — গেমিং, ভিডিও, স্ক্রলিং সব কিছু স্মুথ।\n✦ ব্যাটারি: ৫০০০ mAh — পুরো দিন বিনা চিন্তায়।\n✦ পারফরম্যান্স: Snapdragon 680 — মাল্টিটাস্কিং একদম মসৃণ।\n\nএটি Samsung-এর অফিসিয়াল প্রোডাক্ট, ১ বছরের ওয়ারেন্টি সহ। সীমিত স্টক — অর্ডার দিন এখনই।',
  '[
    {"question":"এটি কি অফিসিয়াল Samsung প্রোডাক্ট?","answer":"হ্যাঁ, ১০০% অফিসিয়াল ও ১ বছরের Samsung ওয়ারেন্টি সহ।"},
    {"question":"বক্সে কী কী থাকবে?","answer":"ফোন, ডাটা ক্যাবল, ইউজার ম্যানুয়াল, সিম ইজেক্টর। চার্জার আলাদা কিনতে হবে।"},
    {"question":"কোন কালার পাব?","answer":"Black, Light Blue, Peach — স্টক অনুযায়ী। অর্ডারের সময় চয়েস জানাতে পারবেন।"},
    {"question":"EMI পেমেন্ট আছে?","answer":"৩ থেকে ১২ মাসের EMI সুবিধা রয়েছে নির্বাচিত ব্যাংক কার্ডে।"}
  ]'::jsonb,
  '[
    {"icon":"shield","label":"১ বছরের অফিসিয়াল ওয়ারেন্টি"},
    {"icon":"truck","label":"ফ্রি হোম ডেলিভারি"},
    {"icon":"check","label":"১০০% অরিজিনাল গ্যারান্টি"},
    {"icon":"phone","label":"কাস্টমার সাপোর্ট"}
  ]'::jsonb,
  false, true, 8
);

-- Sample Landing Page 3: Budget Combo (2 products, urgency-focused)
INSERT INTO public.landing_pages (
  slug, status, title, meta_description, theme_preset,
  hero_headline, hero_subheadline, hero_image_url, cta_text,
  products, enable_bundle, bundle_discount_percent, bundle_label,
  bullet_points, long_description, faq_items, trust_badges,
  countdown_enabled, countdown_end_at,
  stock_counter_enabled, stock_counter_value
) VALUES (
  'budget-phone-offer',
  'draft',
  'বাজেট স্মার্টফোন স্পেশাল অফার',
  'বাজেটের মধ্যে সেরা ২টি স্মার্টফোন — Tecno Spark Go3 ও Infinix Smart 10 Plus। সীমিত সময়ের অফার!',
  'bold_red',
  '🔥 মাত্র ১৩,৫০০ টাকায় স্মার্টফোন!',
  'বাজেটের মধ্যে দুর্দান্ত পারফরম্যান্স — সীমিত সময়ের জন্য',
  'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=80',
  '🚀 অর্ডার করুন — সীমিত স্টক',
  '[
    {"product_id":"7134d3c5-0a23-41c6-b4ce-f38441800272","special_price":12500},
    {"product_id":"dbdb1b40-cc0f-472f-b512-bb8cd1cc26ee","special_price":13900}
  ]'::jsonb,
  true, 8, 'ডুয়াল কম্বো ডিল',
  '[
    {"text":"১০০% অরিজিনাল ও নতুন ফোন"},
    {"text":"৬ মাসের ওয়ারেন্টি সহ"},
    {"text":"ক্যাশ অন ডেলিভারি — সারাদেশে"},
    {"text":"ফ্রি ডেলিভারি ঢাকার ভিতরে"},
    {"text":"৭ দিনের রিপ্লেসমেন্ট পলিসি"}
  ]'::jsonb,
  E'বাজেটের মধ্যে দুটি দারুণ স্মার্টফোন — যাদের প্রথম স্মার্টফোন কিনতে চান বা সেকেন্ডারি ডিভাইস দরকার।\n\n📱 Tecno Spark Go3 (4/64GB) — দৈনন্দিন ব্যবহারের জন্য পারফেক্ট\n📱 Infinix Smart 10 Plus — বড় ডিসপ্লে, ভালো ব্যাটারি\n\nদুটি একসাথে নিলে ৮% অতিরিক্ত ছাড় — আজকের জন্য। অফার সীমিত!',
  '[
    {"question":"কোনটি ভালো হবে আমার জন্য?","answer":"Tecno Spark Go3 — ছোট পরিবারের জন্য, কম দামে। Infinix Smart 10 Plus — যাদের বড় ডিসপ্লে দরকার তাদের জন্য।"},
    {"question":"ওয়ারেন্টি কতদিনের?","answer":"৬ মাসের সেলার ওয়ারেন্টি — যেকোনো সমস্যায় আমরা আছি।"},
    {"question":"ডেলিভারি চার্জ কত?","answer":"ঢাকার ভিতরে ফ্রি, ঢাকার বাইরে ১০০-১৫০ টাকা।"}
  ]'::jsonb,
  '[
    {"icon":"truck","label":"ক্যাশ অন ডেলিভারি"},
    {"icon":"shield","label":"৬ মাসের ওয়ারেন্টি"},
    {"icon":"clock","label":"দ্রুত ডেলিভারি"},
    {"icon":"star","label":"হাজারো সন্তুষ্ট গ্রাহক"}
  ]'::jsonb,
  true, (now() + interval '3 days'),
  true, 15
);

-- ---------------------------------------------------------------------
-- STEP 33/68  (20260426022059)
-- ---------------------------------------------------------------------
UPDATE public.landing_pages
SET status = 'published', publish_at = now(), updated_at = now()
WHERE slug IN ('smartphone-eid-combo', 'samsung-a23-premium', 'budget-phone-offer');

-- ---------------------------------------------------------------------
-- STEP 34/68  (20260501041844)
-- ---------------------------------------------------------------------
UPDATE site_settings SET value='01725391686' WHERE key='footer_phone';
UPDATE site_settings SET value='https://www.facebook.com/profile.php?id=61550473965187' WHERE key='footer_facebook';

-- ---------------------------------------------------------------------
-- STEP 35/68  (20260504184103)
-- ---------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'upnex360@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 36/68  (20260504184159)
-- ---------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- STEP 37/68  (20260504185110)
-- ---------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, label) VALUES
  ('brand_name', 'Surzo Shop', 'ব্র্যান্ড নাম'),
  ('brand_tagline', 'স্বল্প মূল্যে সেরা পণ্য', 'ট্যাগলাইন'),
  ('brand_logo_url', '', 'লোগো (URL)'),
  ('header_phone', '+8801779801680', 'হেডার ফোন'),
  ('footer_phone', '01725391686', 'ফুটার ফোন'),
  ('footer_email', 'surzoshop@gmail.com', 'ফুটার ইমেইল'),
  ('footer_location', 'আশুরন্দ বাজার, সাপাহার, নওগাঁ', 'ঠিকানা'),
  ('footer_about', 'ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল — সেরা পণ্য সরাসরি আপনার হাতের কাছে।', 'ফুটার সংক্ষিপ্ত পরিচিতি'),
  ('footer_facebook', '#', 'Facebook লিংক'),
  ('footer_instagram', '#', 'Instagram লিংক'),
  ('footer_youtube', '#', 'YouTube লিংক'),
  ('footer_copyright', '© {year} Surzo Shop — স্বল্প মূল্যে সেরা পণ্য। সর্বস্বত্ব সংরক্ষিত।', 'কপিরাইট টেক্সট')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 38/68  (20260504190347)
-- ---------------------------------------------------------------------
-- Insert Mango category
INSERT INTO public.categories (name, name_bn, description, requires_weight, sort_order, image_url)
VALUES ('mango', 'আম', 'সাপাহারের খাঁটি ও রাসায়নিকমুক্ত প্রিমিয়াম আম', true, 1,
  'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert products referencing mango category
WITH cat AS (
  SELECT id FROM public.categories WHERE name = 'mango' LIMIT 1
)
INSERT INTO public.products
  (name, name_bn, description, description_bn, category_id, price, compare_price, cost_price, stock, image_url, images, weight, unit, grade, is_active, is_featured)
SELECT * FROM (VALUES
  (
    'Amrapali Mango (Rupali)',
    'আম্রপালি আম (রুপালি)',
    'Amrapali (locally Rupali) is a hybrid of Dasheri and Neelum. Small to medium fruit, deep orange flesh, very sweet (22–24° Brix), fiberless and aromatic. Hand-picked from Sapahar orchards, naturally ripened — no carbide.',
    'আম্রপালি (স্থানীয় ভাবে রুপালি) দশেহারি ও নীলম জাতের সংকর। ছোট থেকে মাঝারি আকার, গাঢ় কমলা রঙের শাঁস, অত্যন্ত মিষ্টি (২২-২৪° ব্রিক্স), আঁশহীন ও সুগন্ধি। সাপাহারের বাগান থেকে হাতে পাড়া, প্রাকৃতিকভাবে পাকানো — কোন কার্বাইড ব্যবহার নেই।',
    (SELECT id FROM cat), 110, 140, 70, 500,
    'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop'
    ],
    '১ কেজি', 'kg', 'A+', true, true
  ),
  (
    'Langra Mango',
    'ল্যাংড়া আম',
    'Heritage Langra mango — green-yellow skin even when ripe, lemon-yellow fiberless flesh with a unique turpentine-sweet aroma. A GI-tagged variety prized across Bengal. Tree-ripened in Sapahar.',
    'ঐতিহ্যবাহী ল্যাংড়া আম — পাকলেও সবুজাভ-হলুদ খোসা, লেবু-হলুদ আঁশহীন শাঁস ও অনন্য মিষ্টি-গন্ধ। সাপাহারের গাছে পাকানো GI-ট্যাগ প্রাপ্ত বিশেষ জাত।',
    (SELECT id FROM cat), 95, 120, 60, 400,
    'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop'
    ],
    '১ কেজি', 'kg', 'A', true, true
  ),
  (
    'Gopalbhog Mango',
    'গোপালভোগ আম',
    'The early-season king of Bangladeshi mangoes — Gopalbhog is medium sized, golden yellow, with rich aroma, soft melting flesh and intense sweetness. The first premium mango of the season from Sapahar.',
    'বাংলাদেশী আমের রাজা গোপালভোগ — মাঝারি আকার, সোনালি হলুদ রঙ, ঘন সুগন্ধ, নরম গলে যাওয়া শাঁস ও তীব্র মিষ্টতা। সাপাহারের মৌসুমের প্রথম প্রিমিয়াম আম।',
    (SELECT id FROM cat), 130, 160, 85, 300,
    'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&auto=format&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop'
    ],
    '১ কেজি', 'kg', 'A+', true, true
  ),
  (
    'Katimon Mango (Twelve-month)',
    'কাটিমন আম (বারোমাসি)',
    'Thai-origin Katimon — a year-round (Baromasi) mango that fruits 2–3 times a year. Long oval shape, crisp when raw, super sweet (20–22° Brix) when ripe, with very small seed and almost no fiber. Sapahar''s newest premium variety.',
    'থাই জাতের কাটিমন — বছরে ২-৩ বার ফলনশীল বারোমাসি আম। লম্বাটে আকৃতি, কাঁচায় কুড়মুড়ে, পাকলে অত্যন্ত মিষ্টি (২০-২২° ব্রিক্স), খুব ছোট আঁটি ও প্রায় আঁশহীন। সাপাহারের নতুন প্রিমিয়াম জাত।',
    (SELECT id FROM cat), 180, 220, 110, 250,
    'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=800&q=80&auto=format&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop'
    ],
    '১ কেজি', 'kg', 'A+', true, true
  )
) AS v(name, name_bn, description, description_bn, category_id, price, compare_price, cost_price, stock, image_url, images, weight, unit, grade, is_active, is_featured);

-- ---------------------------------------------------------------------
-- STEP 39/68  (20260504190945)
-- ---------------------------------------------------------------------
-- Additional categories
INSERT INTO public.categories (name, name_bn, description, requires_weight, sort_order, image_url) VALUES
  ('lychee', 'লিচু', 'রাজশাহীর রসালো ও মিষ্টি লিচু', true, 2, 'https://images.unsplash.com/photo-1629211044657-c2db75bf76b8?w=800&q=80&auto=format&fit=crop'),
  ('honey', 'মধু', 'সুন্দরবন ও সরিষা ফুলের খাঁটি মধু', false, 3, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop'),
  ('pickle', 'আচার', 'হাতে তৈরি ঘরোয়া আচার', false, 4, 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=800&q=80&auto=format&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert additional mango varieties + new products
WITH cat AS (SELECT id, name FROM public.categories)
INSERT INTO public.products
  (name, name_bn, description, description_bn, category_id, price, compare_price, cost_price, stock, image_url, images, weight, unit, grade, is_active, is_featured)
SELECT
  v.name, v.name_bn, v.description, v.description_bn,
  (SELECT id FROM cat WHERE name = v.cat_name),
  v.price, v.compare_price, v.cost_price, v.stock,
  v.image_url, ARRAY[v.image_url, v.image_url2], v.weight, v.unit, v.grade, true, v.featured
FROM (VALUES
  -- More mango varieties
  ('Fazli Mango', 'ফজলি আম',
   'King-size late-season Fazli — large 800g–1.5kg fruit with smooth golden skin, pale yellow fiberless flesh and mild sweetness. Perfect for desserts and aam-shotto.',
   'মৌসুমের শেষ দিকের রাজা আকৃতির ফজলি — ৮০০ গ্রাম থেকে ১.৫ কেজি ওজনের বড় ফল, মসৃণ সোনালি খোসা, হালকা হলুদ আঁশহীন শাঁস ও মৃদু মিষ্টতা। আমসত্ত্ব ও মিষ্টান্নের জন্য আদর্শ।',
   'mango', 90, 120, 55, 350,
   'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A', true),
  ('Himsagar Mango', 'হিমসাগর আম',
   'Himsagar — the "King of Mangoes" of Bengal. Medium green-yellow fruit, fiberless saffron-colored flesh, intensely sweet and aromatic. Limited season — May to June only.',
   'হিমসাগর — বাংলার "আমের রাজা"। মাঝারি সবুজ-হলুদ ফল, আঁশহীন জাফরান রঙের শাঁস, তীব্র মিষ্টি ও সুগন্ধি। সীমিত মৌসুম — শুধু মে-জুন।',
   'mango', 140, 180, 90, 300,
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', true),
  ('Haribhanga Mango', 'হাড়িভাঙ্গা আম',
   'Famous Rangpur-origin Haribhanga — uniform sized, golden-green skin, fiberless juicy flesh and sugar-like sweetness. Long shelf life, ideal for shipping.',
   'রংপুরের বিখ্যাত হাড়িভাঙ্গা — সমান আকার, সোনালি-সবুজ খোসা, আঁশহীন রসালো শাঁস ও চিনির মতো মিষ্টতা। দীর্ঘ সংরক্ষণযোগ্য, পাঠানোর জন্য আদর্শ।',
   'mango', 120, 150, 75, 400,
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', false),
  ('Khirsapat Mango', 'ক্ষিরসাপাত আম',
   'GI-tagged Chapainawabganj Khirsapat — medium oval fruit, thin yellow skin, dense saffron flesh, very sweet with floral aroma. Premium gifting variety.',
   'GI-ট্যাগ প্রাপ্ত চাঁপাইনবাবগঞ্জের ক্ষিরসাপাত — মাঝারি ডিম্বাকৃতি ফল, পাতলা হলুদ খোসা, ঘন জাফরান শাঁস, ফুলের সুগন্ধযুক্ত অত্যন্ত মিষ্টি। উপহারের জন্য প্রিমিয়াম।',
   'mango', 135, 170, 85, 280,
   'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', false),
  ('Ashwina Mango', 'আশ্বিনা আম',
   'Late-season Ashwina (August–September) — large green fruit even when ripe, slightly tangy-sweet, perfect for pickles, juice and chutney. Long-lasting.',
   'মৌসুমের শেষের আশ্বিনা (আগস্ট-সেপ্টেম্বর) — পাকলেও বড় সবুজ ফল, হালকা টক-মিষ্টি, আচার, জুস ও চাটনির জন্য আদর্শ। দীর্ঘস্থায়ী।',
   'mango', 70, 95, 45, 500,
   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A', false),
  ('Banana Mango (Sagor Kola)', 'বানানা আম (সাগর কলা)',
   'Elongated banana-shaped Thai variety — small seed, fiberless thick flesh, candy-like sweetness. A unique novelty mango from Sapahar orchards.',
   'লম্বাটে কলার মতো আকৃতির থাই জাত — ছোট আঁটি, আঁশহীন পুরু শাঁস, ক্যান্ডির মতো মিষ্টতা। সাপাহার বাগানের অনন্য জাত।',
   'mango', 200, 250, 130, 150,
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', false),
  -- Lychee
  ('Bombai Lychee', 'বোম্বাই লিচু',
   'Premium Rajshahi Bombai lychee — large red fruit, crisp translucent flesh, small seed, super juicy and sweet. Limited 3-week season.',
   'প্রিমিয়াম রাজশাহীর বোম্বাই লিচু — বড় লাল ফল, কুড়মুড়ে স্বচ্ছ শাঁস, ছোট আঁটি, অত্যন্ত রসালো ও মিষ্টি। সীমিত ৩ সপ্তাহের মৌসুম।',
   'lychee', 350, 450, 230, 200,
   'https://images.unsplash.com/photo-1629211044657-c2db75bf76b8?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1629211044657-c2db75bf76b8?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', true),
  ('China-3 Lychee', 'চায়না-৩ লিচু',
   'China-3 variety — heart-shaped, deep red skin, large fleshy fruit with tiny seed. Sweet-aromatic and very popular in Bangladesh.',
   'চায়না-৩ জাত — হৃদয় আকৃতির, গাঢ় লাল খোসা, ছোট আঁটিযুক্ত বড় মাংসল ফল। মিষ্টি-সুগন্ধি ও বাংলাদেশে অত্যন্ত জনপ্রিয়।',
   'lychee', 400, 500, 260, 180,
   'https://images.unsplash.com/photo-1629211044657-c2db75bf76b8?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1629211044657-c2db75bf76b8?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', false),
  -- Honey
  ('Sundarban Wild Honey', 'সুন্দরবনের মধু',
   'Pure wild honey collected by Mawalis from Sundarban mangrove forest. Raw, unprocessed, dark amber color with distinctive flavor. 100% natural.',
   'সুন্দরবনের ম্যানগ্রোভ বন থেকে মৌয়ালদের সংগৃহীত খাঁটি বুনো মধু। কাঁচা, প্রক্রিয়াবিহীন, গাঢ় অ্যাম্বার রঙ ও স্বতন্ত্র স্বাদ। ১০০% প্রাকৃতিক।',
   'honey', 850, 1100, 550, 100,
   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+', true),
  ('Mustard Flower Honey', 'সরিষা ফুলের মধু',
   'Light golden mustard flower honey from Naogaon mustard fields. Mild, smooth taste, crystallizes naturally — sign of purity.',
   'নওগাঁর সরিষা ক্ষেতের হালকা সোনালি সরিষা ফুলের মধু। মৃদু, মসৃণ স্বাদ, প্রাকৃতিকভাবে জমে যায় — খাঁটিত্বের প্রমাণ।',
   'honey', 600, 800, 400, 150,
   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A', false),
  -- Pickle
  ('Mango Pickle (Achar)', 'আমের আচার',
   'Traditional homemade mango pickle — sun-cured raw Ashwina mango with mustard oil, panch-phoron and chili. No preservatives, 1-year shelf life.',
   'ঐতিহ্যবাহী ঘরে তৈরি আমের আচার — সরিষার তেল, পাঁচফোড়ন ও মরিচসহ রোদে শুকানো কাঁচা আশ্বিনা আম। কোন প্রিজারভেটিভ নেই, ১ বছর সংরক্ষণযোগ্য।',
   'pickle', 450, 550, 280, 80,
   'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=800&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=800&q=80&auto=format&fit=crop',
   '৫০০ গ্রাম', 'piece', 'A+', false)
) AS v(name, name_bn, description, description_bn, cat_name, price, compare_price, cost_price, stock, image_url, image_url2, weight, unit, grade, featured);

-- ---------------------------------------------------------------------
-- STEP 40/68  (20260504191605)
-- ---------------------------------------------------------------------
-- Wipe existing catalog (mango-only business)
DELETE FROM public.order_items WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.products;
DELETE FROM public.categories;

-- Add 4 mango variety categories
INSERT INTO public.categories (name, name_bn, description, requires_weight, sort_order, image_url) VALUES
  ('amrapali', 'আম্রপালি (রুপালি) আম',
   'সাপাহারের রসালো আম্রপালি / রুপালি আম — আঁশহীন ও মিষ্টি',
   true, 1,
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=1000&q=80&auto=format&fit=crop'),
  ('haribhanga', 'হাড়িভাঙা আম',
   'রংপুর-সাপাহার অঞ্চলের বিখ্যাত হাড়িভাঙা — চিনির মতো মিষ্টি',
   true, 2,
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=1000&q=80&auto=format&fit=crop'),
  ('fazli', 'ফজলি আম',
   'বড় আকৃতির রাজা ফজলি — মৌসুমের শেষ প্রিমিয়াম আম',
   true, 3,
   'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1000&q=80&auto=format&fit=crop'),
  ('katimon', 'কাঁঠিমুন (বারোমাসি) আম',
   'থাই বারোমাসি কাঁঠিমুন — বছরে ২-৩ বার ফলনশীল প্রিমিয়াম জাত',
   true, 4,
   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=1000&q=80&auto=format&fit=crop');

-- Add one premium product per category
WITH cat AS (SELECT id, name FROM public.categories)
INSERT INTO public.products
  (name, name_bn, description, description_bn, category_id, price, compare_price, cost_price, stock, image_url, images, weight, unit, grade, is_active, is_featured)
SELECT
  v.name, v.name_bn, v.description, v.description_bn,
  (SELECT id FROM cat WHERE name = v.cat_name),
  v.price, v.compare_price, v.cost_price, v.stock,
  v.image_url, ARRAY[v.image_url, v.image_url2], v.weight, v.unit, v.grade, true, true
FROM (VALUES
  ('Amrapali Mango (Rupali)', 'আম্রপালি আম (রুপালি)',
   'Hybrid of Dasheri and Neelum. Small to medium fruit, deep orange fiberless flesh, intensely sweet (22–24° Brix). Hand-picked from Sapahar, naturally ripened — no carbide, no chemicals.',
   'দশেহারি ও নীলম জাতের সংকর। ছোট থেকে মাঝারি আকার, গাঢ় কমলা আঁশহীন শাঁস, অত্যন্ত মিষ্টি (২২-২৪° ব্রিক্স)। সাপাহার থেকে হাতে পাড়া, প্রাকৃতিকভাবে পাকানো — কোন কার্বাইড বা রাসায়নিক নেই।',
   'amrapali', 110, 140, 70, 500,
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=1000&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1000&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+'),
  ('Haribhanga Mango', 'হাড়িভাঙা আম',
   'Famous Rangpur-origin Haribhanga — uniform sized, golden-green skin, fiberless juicy flesh, sugar-like sweetness. Long shelf life, ideal for home delivery across Bangladesh.',
   'রংপুরের বিখ্যাত হাড়িভাঙা — সমান আকার, সোনালি-সবুজ খোসা, আঁশহীন রসালো শাঁস ও চিনির মতো মিষ্টতা। দীর্ঘ সংরক্ষণযোগ্য, সারা বাংলাদেশে হোম ডেলিভারির জন্য আদর্শ।',
   'haribhanga', 120, 150, 75, 500,
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=1000&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=1000&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+'),
  ('Fazli Mango', 'ফজলি আম',
   'King-size late-season Fazli — large 800g–1.5kg fruit with smooth golden skin, pale yellow fiberless flesh and mild balanced sweetness. Perfect for desserts, juice and aam-shotto.',
   'মৌসুমের শেষের রাজা আকৃতির ফজলি — ৮০০ গ্রাম থেকে ১.৫ কেজি ওজনের বড় ফল, মসৃণ সোনালি খোসা, হালকা হলুদ আঁশহীন শাঁস ও সুষম মিষ্টতা। আমসত্ত্ব, জুস ও মিষ্টান্নের জন্য আদর্শ।',
   'fazli', 90, 120, 55, 400,
   'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1000&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=1000&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A'),
  ('Katimon Mango (Twelve-month)', 'কাঁঠিমুন আম (বারোমাসি)',
   'Thai-origin Katimon — Baromasi mango fruiting 2–3 times a year. Long oval shape, crisp when raw, super sweet (20–22° Brix) when ripe, very small seed and almost no fiber. Sapahar''s newest premium variety.',
   'থাই জাতের কাঁঠিমুন — বছরে ২-৩ বার ফলনশীল বারোমাসি আম। লম্বাটে আকৃতি, কাঁচায় কুড়মুড়ে, পাকলে অত্যন্ত মিষ্টি (২০-২২° ব্রিক্স), খুব ছোট আঁটি ও প্রায় আঁশহীন। সাপাহারের নতুন প্রিমিয়াম জাত।',
   'katimon', 180, 220, 110, 300,
   'https://images.unsplash.com/photo-1553279768-865429fa0078?w=1000&q=80&auto=format&fit=crop',
   'https://images.unsplash.com/photo-1623930154200-ed53fc909c54?w=1000&q=80&auto=format&fit=crop',
   '১ কেজি', 'kg', 'A+')
) AS v(name, name_bn, description, description_bn, cat_name, price, compare_price, cost_price, stock, image_url, image_url2, weight, unit, grade);

-- ---------------------------------------------------------------------
-- STEP 41/68  (20260504192839)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'Sapahar Mango Shop — সাপাহারের সেরা ও সুস্বাদু আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়। ১০০% খাঁটি, রাসায়নিকমুক্ত।', updated_at = now() WHERE key = 'footer_about';

UPDATE public.site_settings SET value = '© {year} Sapahar Mango Shop — সাপাহারের খাঁটি আমের নির্ভরযোগ্য ঠিকানা। সর্বস্বত্ব সংরক্ষিত।', updated_at = now() WHERE key = 'footer_copyright';

UPDATE public.site_settings SET value = 'সাপাহার বাজার, সাপাহার, নওগাঁ', updated_at = now() WHERE key = 'footer_location';

-- ---------------------------------------------------------------------
-- STEP 42/68  (20260504194040)
-- ---------------------------------------------------------------------
INSERT INTO public.customer_reviews (customer_name, location, rating, review_text, status, is_active, sort_order, submitted_by_customer) VALUES
('মোঃ রাকিবুল ইসলাম', 'ঢাকা, মিরপুর', 5, 'সাপাহারের আম্রপালি আম এত মিষ্টি হবে কল্পনাই করিনি! সরাসরি বাগান থেকে এসেছে, একদম তাজা। ১০০% খাঁটি, পরিবারের সবাই খুব পছন্দ করেছে। ধন্যবাদ Sapahar Mango Shop!', 'approved', true, 1, false),
('সাবিনা ইয়াসমিন', 'চট্টগ্রাম, পাঁচলাইশ', 5, 'হাড়িভাঙা আমের স্বাদ অসাধারণ। কোনো রাসায়নিক নেই, ঘ্রাণটাই বলে দেয় খাঁটি। ডেলিভারিও দ্রুত পেয়েছি। আবারও অর্ডার করব ইনশাআল্লাহ।', 'approved', true, 2, false),
('আব্দুল্লাহ আল মামুন', 'সিলেট, জিন্দাবাজার', 5, 'ফজলি আমের সাইজ আর মিষ্টতা দুটোই দারুণ। প্যাকেজিং খুব যত্ন সহকারে করা ছিল, একটাও নষ্ট হয়নি। বিশ্বস্ত সেবা।', 'approved', true, 3, false),
('তানজিনা আক্তার', 'রাজশাহী, বোয়ালিয়া', 5, 'কাঁঠিমুন আমের জন্য পুরো পরিবার এখন Sapahar Mango Shop-এর ভক্ত। দাম রিজনেবল, কোয়ালিটি প্রিমিয়াম। হাইলি রিকমেন্ডেড।', 'approved', true, 4, false),
('হাসান মাহমুদ', 'খুলনা, সোনাডাঙা', 5, 'অনলাইনে আম কিনতে ভয় পেতাম, কিন্তু এই দোকান সেই ভয় দূর করে দিল। আম্রপালি আম একদম গাছ পাকা, ফরমালিন মুক্ত।', 'approved', true, 5, false),
('ফারহানা ইসলাম', 'ঢাকা, ধানমন্ডি', 5, 'বাচ্চারা Sapahar-এর হাড়িভাঙা আম এত পছন্দ করেছে যে এক সপ্তাহে শেষ! আবার অর্ডার করেছি। কাস্টমার সার্ভিসও খুব আন্তরিক।', 'approved', true, 6, false),
('মোঃ ইমরান হোসেন', 'কুমিল্লা, কোতয়ালী', 5, 'COD অপশন থাকায় কোনো ঝামেলা ছাড়াই অর্ডার করেছি। সাপাহারের ফজলি আম মিষ্টি ও রসালো। বাংলাদেশের সেরা আম এখানে।', 'approved', true, 7, false),
('নুসরাত জাহান', 'ময়মনসিংহ, সদর', 5, 'কাঁঠিমুন আম সিজনের বাইরেও পেলাম, এতো ফ্রেশ! পরিবারের জন্য নিয়মিত নিচ্ছি। সাপাহার ম্যাঙ্গো শপ সত্যিই বিশ্বাসযোগ্য।', 'approved', true, 8, false),
('শাহরিয়ার কবির', 'বরিশাল, সদর', 4, 'ডেলিভারি একদিন দেরি হলেও আমের কোয়ালিটি দেখে সব ভুলে গেছি। আম্রপালির স্বাদ অতুলনীয়। পরবর্তীতে আবার অর্ডার করব।', 'approved', true, 9, false),
('মাহমুদা খাতুন', 'নওগাঁ, সাপাহার', 5, 'লোকাল হিসেবে গর্ব করি Sapahar Mango Shop-এর জন্য। সাপাহারের আমের যে আসল স্বাদ, সেটাই তারা সারাদেশে ছড়িয়ে দিচ্ছে।', 'approved', true, 10, false),
('জুবায়ের রহমান', 'গাজীপুর, টঙ্গী', 5, 'হাড়িভাঙা আম এর আগে কখনো এত মিষ্টি খাইনি। ১০ কেজি অর্ডার দিয়েছিলাম, একটাও পচা ছিল না। চমৎকার প্যাকেজিং।', 'approved', true, 11, false),
('আফসানা মিমি', 'নারায়ণগঞ্জ, ফতুল্লা', 5, 'ফজলি আমের সাইজ দেখে অবাক! বাজারের চেয়ে অনেক ভালো ও দাম যুক্তিসঙ্গত। সাপাহার ম্যাঙ্গো শপ এখন আমার পরিবারের পছন্দ।', 'approved', true, 12, false);

-- ---------------------------------------------------------------------
-- STEP 43/68  (20260504202536)
-- ---------------------------------------------------------------------
-- New categories
INSERT INTO public.categories (name, name_bn, requires_weight, sort_order, description) VALUES
('gopalbhog', 'গোপালভোগ আম', true, 5, 'রাজশাহীর সুমিষ্ট গোপালভোগ আম'),
('khirsapat', 'খিরসাপাত (হিমসাগর) আম', true, 6, 'বিশ্বখ্যাত খিরসাপাত / হিমসাগর আম'),
('langra', 'ল্যাংড়া আম', true, 7, 'রাজশাহীর বিখ্যাত ল্যাংড়া আম'),
('miyazaki', 'মিয়াজাকি আম', true, 8, 'বিশ্বের সবচেয়ে দামি জাপানি মিয়াজাকি আম'),
('suryapuri', 'সূর্যপুরী আম', true, 9, 'উত্তরবঙ্গের ঐতিহ্যবাহী সূর্যপুরী আম'),
('ashwina', 'আশ্বিনা আম', true, 10, 'মৌসুমের শেষের আশ্বিনা আম'),
('gourmoti', 'গৌরমতি আম', true, 11, 'নাবি জাতের গৌরমতি আম'),
('bari4', 'বারি আম-৪', true, 12, 'বারি উদ্ভাবিত উচ্চফলনশীল বারি-৪ আম'),
('banana_mango', 'বানানা ম্যাঙ্গো', true, 13, 'লম্বাটে আকৃতির বানানা ম্যাঙ্গো'),
('deshi_ashla', 'দেশি আঁশলা আম', true, 14, 'গ্রামবাংলার ঐতিহ্যবাহী দেশি আঁশলা আম');

-- Products
WITH cats AS (SELECT id, name FROM public.categories)
INSERT INTO public.products (name, name_bn, description, description_bn, category_id, price, compare_price, cost_price, stock, image_url, weight, unit, grade, is_active, is_featured) VALUES
(
  'Gopalbhog Mango',
  'গোপালভোগ আম',
  'Premium Gopalbhog mango from Rajshahi — extremely sweet, fiberless, aromatic early-season variety. Hand-picked from Sapahar orchards.',
  'রাজশাহীর প্রিমিয়াম গোপালভোগ আম — অসম্ভব মিষ্টি, আঁশহীন এবং সুগন্ধি। মৌসুমের শুরুর দিকে পাকে। সাপাহারের বাগান থেকে গাছপাকা সংগ্রহ। মিষ্টি স্বাদ, হলুদ-কমলা শাঁস ও ছোট আঁটি — পরিবারের সবার পছন্দের আম।',
  (SELECT id FROM cats WHERE name='gopalbhog'), 140, 170, 90, 300,
  'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A+', true, true
),
(
  'Khirsapat (Himsagar) Mango',
  'খিরসাপাত (হিমসাগর) আম',
  'World-renowned Khirsapat / Himsagar mango — GI-certified, creamy texture, intense sweetness, minimal fiber. The king of Bangladeshi mangoes.',
  'বিশ্বখ্যাত খিরসাপাত তথা হিমসাগর আম — GI স্বীকৃতিপ্রাপ্ত। ক্রিমের মতো মিহি শাঁস, অসাধারণ মিষ্টি ও সুগন্ধি। আঁশ একদম নেই বললেই চলে। বাংলাদেশের আমের রাজা হিসেবে পরিচিত।',
  (SELECT id FROM cats WHERE name='khirsapat'), 150, 180, 100, 400,
  'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A+', true, true
),
(
  'Langra Mango',
  'ল্যাংড়া আম',
  'Famous Langra mango — green skin even when ripe, juicy yellow pulp, distinctive aroma and balanced sweet-tart flavor.',
  'রাজশাহীর বিখ্যাত ল্যাংড়া আম — পাকলেও খোসা সবুজ থাকে। রসালো হলুদ শাঁস, অনন্য সুগন্ধ এবং মিষ্টি-টক ভারসাম্যপূর্ণ স্বাদ। আম প্রেমীদের প্রথম পছন্দ।',
  (SELECT id FROM cats WHERE name='langra'), 130, 160, 85, 350,
  'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A', true, true
),
(
  'Miyazaki Mango',
  'মিয়াজাকি আম',
  'Premium Japanese Miyazaki "Egg of the Sun" mango — deep red skin, ultra-sweet with unique flavor. Limited stock.',
  'জাপানের বিখ্যাত মিয়াজাকি আম — "Egg of the Sun" নামে পরিচিত। গাঢ় লাল রঙের খোসা, অসাধারণ মিষ্টি ও অনন্য স্বাদ। বিশ্বের সবচেয়ে দামি আম। সীমিত স্টক।',
  (SELECT id FROM cats WHERE name='miyazaki'), 1500, 2000, 900, 30,
  'https://images.unsplash.com/photo-1546173159-315724a31696?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A++', true, true
),
(
  'Suryapuri Mango',
  'সূর্যপুরী আম',
  'Heritage Suryapuri mango from northern Bangladesh — large size, golden yellow pulp, traditional taste.',
  'উত্তরবঙ্গের ঐতিহ্যবাহী সূর্যপুরী আম — বড় আকার, সোনালি হলুদ শাঁস, ঐতিহ্যবাহী মিষ্টি স্বাদ। গ্রামীণ স্বাদ পেতে চাইলে এটি আপনার জন্য।',
  (SELECT id FROM cats WHERE name='suryapuri'), 100, 130, 65, 250,
  'https://images.unsplash.com/photo-1519096845289-95806ee03a1a?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A', true, false
),
(
  'Ashwina Mango',
  'আশ্বিনা আম',
  'Late-season Ashwina mango — available when other mangoes are gone. Slightly tart, firm flesh, excellent for pickles and fresh eating.',
  'মৌসুমের শেষের আশ্বিনা আম — যখন অন্য আম শেষ তখনও পাওয়া যায়। হালকা টক-মিষ্টি স্বাদ, শক্ত শাঁস। আচার এবং তাজা খাওয়া দুটোতেই দারুণ।',
  (SELECT id FROM cats WHERE name='ashwina'), 80, 110, 55, 300,
  'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A', true, false
),
(
  'Gourmoti Mango',
  'গৌরমতি আম',
  'Late-variety Gourmoti mango — rich sweet flavor, deep yellow pulp, harvested in late August.',
  'নাবি জাতের গৌরমতি আম — গভীর মিষ্টি স্বাদ, গাঢ় হলুদ শাঁস। আগস্টের শেষে সংগ্রহ করা হয়। দেরিতে পাওয়া আমের মধ্যে অন্যতম সেরা।',
  (SELECT id FROM cats WHERE name='gourmoti'), 160, 200, 110, 200,
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A+', true, true
),
(
  'BARI Aam-4',
  'বারি আম-৪',
  'BARI-developed high-yield mango variety — large fruit, sweet, fiberless, excellent shelf life.',
  'বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI) উদ্ভাবিত উচ্চফলনশীল আম — বড় আকার, মিষ্টি, আঁশহীন এবং দীর্ঘ সংরক্ষণযোগ্য।',
  (SELECT id FROM cats WHERE name='bari4'), 120, 150, 80, 300,
  'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A', true, false
),
(
  'Banana Mango',
  'বানানা ম্যাঙ্গো',
  'Unique elongated Banana mango — looks like a banana, sweet flavor, fiberless pulp, conversation-starter fruit.',
  'অনন্য বানানা ম্যাঙ্গো — কলার মতো লম্বাটে আকৃতি। মিষ্টি স্বাদ, আঁশহীন শাঁস। দেখতে যেমন আকর্ষণীয়, খেতেও তেমনই দারুণ।',
  (SELECT id FROM cats WHERE name='banana_mango'), 200, 250, 130, 150,
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A+', true, true
),
(
  'Deshi Ashla Mango',
  'দেশি আঁশলা আম',
  'Traditional village Deshi Ashla mango — slightly fibrous, intensely aromatic, perfect for chusha (sucking) and juice.',
  'গ্রামবাংলার ঐতিহ্যবাহী দেশি আঁশলা আম — হালকা আঁশযুক্ত, তীব্র সুগন্ধি। চুষে খাওয়া এবং জুস বানানোর জন্য পারফেক্ট। দাদির হাতের আমের স্বাদ ফিরিয়ে আনে।',
  (SELECT id FROM cats WHERE name='deshi_ashla'), 90, 120, 60, 400,
  'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=1000&q=80&auto=format&fit=crop',
  '1 kg', 'kg', 'A', true, false
);

-- ---------------------------------------------------------------------
-- STEP 44/68  (20260506112041)
-- ---------------------------------------------------------------------
-- Courier providers table
CREATE TABLE public.courier_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view courier providers"
  ON public.courier_providers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert courier providers"
  ON public.courier_providers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courier providers"
  ON public.courier_providers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courier providers"
  ON public.courier_providers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER courier_providers_updated_at
  BEFORE UPDATE ON public.courier_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default rows (empty creds — admin fills via UI; env fallback exists for Pathao)
INSERT INTO public.courier_providers (provider_key, display_name, is_active, is_default, sort_order, credentials)
VALUES
  ('pathao', 'Pathao', true, true, 1, '{"base_url":"https://api-hermes.pathao.com"}'::jsonb),
  ('steadfast', 'Steadfast', false, false, 2, '{"base_url":"https://portal.packzy.com/api/v1"}'::jsonb);

-- Add courier tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_provider TEXT,
  ADD COLUMN IF NOT EXISTS courier_tracking_id TEXT;

-- ---------------------------------------------------------------------
-- STEP 45/68  (20260506122107)
-- ---------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- STEP 46/68  (20260508134742)
-- ---------------------------------------------------------------------
-- 1) ORDERS: drop public SELECT, add owner + admin SELECT
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.orders;

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2) ORDER_ITEMS: drop public SELECT, restrict to owner/admin
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id IS NOT NULL
        AND o.user_id = auth.uid()
    )
  );

-- 3) ABANDONED_CHECKOUTS: scope insert/update to the owning auth user
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;

CREATE POLICY "Users can insert own abandoned checkout"
  ON public.abandoned_checkouts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own abandoned checkout"
  ON public.abandoned_checkouts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update abandoned checkouts"
  ON public.abandoned_checkouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (true);

-- 4) EMAIL_LOGS: remove public insert; service role bypasses RLS for the edge function
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;

-- 5) PRODUCTS: hide cost_price from public clients via column-level grants
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, name_bn, description, description_bn, category_id, price, compare_price, stock, image_url, images, weight, unit, grade, is_active, is_featured, created_at, updated_at, coming_soon)
  ON public.products TO anon, authenticated;
-- Admins (which use the same authenticated role + has_role check via RLS) need cost_price too;
-- grant cost_price to authenticated only — RLS still gates row access, and the column is only
-- read in the admin panel which runs as authenticated.
GRANT SELECT (cost_price) ON public.products TO authenticated;

-- 6) STORAGE: remove broad SELECT policy that allows listing the product-images bucket.
-- Public CDN downloads still work because the bucket is public.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- 7) Helper RPC: generate next sequential order number (replaces client-side count of all orders)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.orders;
  RETURN 'SM-' || LPAD(next_num::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated;

-- 8) Helper RPC: lookup an order by order_number + customer_phone (for guest tracking)
CREATE OR REPLACE FUNCTION public.lookup_order_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  order_number text,
  total numeric,
  subtotal numeric,
  shipping_cost numeric,
  status text,
  created_at timestamptz,
  city text,
  district text,
  payment_method text,
  shipping_address text,
  pathao_consignment_id text,
  pathao_order_status text,
  pathao_tracking_url text,
  delivery_fee numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.total, o.subtotal, o.shipping_cost, o.status,
         o.created_at, o.city, o.district, o.payment_method, o.shipping_address,
         o.pathao_consignment_id, o.pathao_order_status, o.pathao_tracking_url, o.delivery_fee
  FROM public.orders o
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_order_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_number(text, text) TO anon, authenticated;

-- 9) Helper RPC: count orders for a customer email (used to detect first-time customer)
CREATE OR REPLACE FUNCTION public.count_orders_by_email(_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.orders WHERE customer_email = _email
$$;

REVOKE ALL ON FUNCTION public.count_orders_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_orders_by_email(text) TO anon, authenticated;

-- 10) Helper RPC: lookup order items by order_number + customer_phone (paired with #8)
CREATE OR REPLACE FUNCTION public.lookup_order_items_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_name text,
  quantity integer,
  price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
$$;

REVOKE ALL ON FUNCTION public.lookup_order_items_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_items_by_number(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 47/68  (20260508135910)
-- ---------------------------------------------------------------------
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- STEP 48/68  (20260509073732)
-- ---------------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES ('product_frame_url', '/brand/product-frame.png') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value) VALUES ('product_frame_inset', '{"left":0.1196,"top":0.2329,"right":0.874,"bottom":0.8238}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ---------------------------------------------------------------------
-- STEP 49/68  (20260511065902)
-- ---------------------------------------------------------------------
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'mehediwork@gmail.com' AND email_confirmed_at IS NULL;
INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'mehediwork@gmail.com' ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 50/68  (20260511070911)
-- ---------------------------------------------------------------------
-- Categories
WITH new_cats AS (
  INSERT INTO public.categories (name, name_bn, description, image_url, sort_order, requires_weight) VALUES
  ('Amrapali Mango', 'আম্রপালি আম', 'সাপাহারের সেরা আম্রপালি আম', 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80&auto=format&fit=crop', 1, true),
  ('Langra Mango', 'ন্যাংরা আম', 'রাজশাহীর বিখ্যাত ন্যাংরা আম', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80&auto=format&fit=crop', 2, true),
  ('Dates', 'খেজুর', 'প্রিমিয়াম মানের খেজুর', 'https://images.unsplash.com/photo-1609252924088-2a45ee971cdf?w=600&q=80&auto=format&fit=crop', 3, false),
  ('Honey', 'মধু', '১০০% খাঁটি প্রাকৃতিক মধু', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80&auto=format&fit=crop', 4, false)
  RETURNING id, name
)
INSERT INTO public.products (name, name_bn, description_bn, category_id, price, compare_price, cost_price, stock, image_url, weight, unit, grade, is_active, is_featured)
SELECT * FROM (VALUES
  -- Amrapali (4 products)
  ('Amrapali 5kg', 'আম্রপালি আম ৫ কেজি', 'সরাসরি বাগান থেকে গাছপাকা আম্রপালি আম', (SELECT id FROM new_cats WHERE name='Amrapali Mango'), 950::numeric, 1100::numeric, 600::numeric, 100, 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop', '5 kg', 'kg', 'A', true, true),
  ('Amrapali 10kg', 'আম্রপালি আম ১০ কেজি', 'পরিবারের জন্য পরিপূর্ণ ১০ কেজি প্যাক', (SELECT id FROM new_cats WHERE name='Amrapali Mango'), 1800::numeric, 2100::numeric, 1150::numeric, 80, 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&q=80&auto=format&fit=crop', '10 kg', 'kg', 'A', true, true),
  ('Amrapali Premium 5kg', 'আম্রপালি প্রিমিয়াম ৫ কেজি', 'বাছাইকৃত বড় সাইজের প্রিমিয়াম আম', (SELECT id FROM new_cats WHERE name='Amrapali Mango'), 1100::numeric, 1300::numeric, 700::numeric, 60, 'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop', '5 kg', 'kg', 'A+', true, false),
  ('Amrapali Premium 10kg', 'আম্রপালি প্রিমিয়াম ১০ কেজি', 'প্রিমিয়াম গ্রেড বড় সাইজের আম ১০ কেজি', (SELECT id FROM new_cats WHERE name='Amrapali Mango'), 2100::numeric, 2400::numeric, 1350::numeric, 50, 'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&q=80&auto=format&fit=crop', '10 kg', 'kg', 'A+', true, false),
  -- Langra (4 products)
  ('Langra 5kg', 'ন্যাংরা আম ৫ কেজি', 'রাজশাহীর বিখ্যাত মিষ্টি ন্যাংরা আম', (SELECT id FROM new_cats WHERE name='Langra Mango'), 1000::numeric, 1200::numeric, 650::numeric, 90, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop', '5 kg', 'kg', 'A', true, true),
  ('Langra 10kg', 'ন্যাংরা আম ১০ কেজি', 'পরিবারের জন্য ১০ কেজি ন্যাংরা আম', (SELECT id FROM new_cats WHERE name='Langra Mango'), 1900::numeric, 2300::numeric, 1250::numeric, 70, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80&auto=format&fit=crop', '10 kg', 'kg', 'A', true, true),
  ('Langra Premium 5kg', 'ন্যাংরা প্রিমিয়াম ৫ কেজি', 'বাছাইকৃত প্রিমিয়াম ন্যাংরা', (SELECT id FROM new_cats WHERE name='Langra Mango'), 1200::numeric, 1400::numeric, 750::numeric, 50, 'https://images.unsplash.com/photo-1623930154130-d3f8b9d92850?w=800&q=80&auto=format&fit=crop', '5 kg', 'kg', 'A+', true, false),
  ('Langra Premium 10kg', 'ন্যাংরা প্রিমিয়াম ১০ কেজি', 'প্রিমিয়াম গ্রেড ১০ কেজি ন্যাংরা', (SELECT id FROM new_cats WHERE name='Langra Mango'), 2300::numeric, 2700::numeric, 1450::numeric, 40, 'https://images.unsplash.com/photo-1623930154130-d3f8b9d92850?w=800&q=80&auto=format&fit=crop', '10 kg', 'kg', 'A+', true, false),
  -- Dates (4 products)
  ('Ajwa Dates 1kg', 'আজওয়া খেজুর ১ কেজি', 'সৌদি আরবের প্রিমিয়াম আজওয়া খেজুর', (SELECT id FROM new_cats WHERE name='Dates'), 1800::numeric, 2200::numeric, 1300::numeric, 50, 'https://images.unsplash.com/photo-1609252924088-2a45ee971cdf?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'Premium', true, true),
  ('Mariam Dates 1kg', 'মরিয়ম খেজুর ১ কেজি', 'মিষ্টি ও নরম মরিয়ম খেজুর', (SELECT id FROM new_cats WHERE name='Dates'), 950::numeric, 1100::numeric, 650::numeric, 80, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'A', true, true),
  ('Medjool Dates 1kg', 'মেডজুল খেজুর ১ কেজি', 'রাজকীয় স্বাদের মেডজুল খেজুর', (SELECT id FROM new_cats WHERE name='Dates'), 1500::numeric, 1700::numeric, 1050::numeric, 60, 'https://images.unsplash.com/photo-1605387950330-25e9b6ee0bcc?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'Premium', true, false),
  ('Safawi Dates 1kg', 'সাফাওয়ী খেজুর ১ কেজি', 'গাঢ় কালো রঙের প্রিমিয়াম খেজুর', (SELECT id FROM new_cats WHERE name='Dates'), 1100::numeric, 1300::numeric, 750::numeric, 70, 'https://images.unsplash.com/photo-1574575394131-1f1c0ddae5ae?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'A', true, false),
  -- Honey (4 products)
  ('Sundarban Honey 1kg', 'সুন্দরবনের মধু ১ কেজি', '১০০% খাঁটি সুন্দরবনের প্রাকৃতিক মধু', (SELECT id FROM new_cats WHERE name='Honey'), 1200::numeric, 1500::numeric, 800::numeric, 50, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'Premium', true, true),
  ('Mustard Honey 1kg', 'সরিষা ফুলের মধু ১ কেজি', 'খাঁটি সরিষা ফুলের মধু', (SELECT id FROM new_cats WHERE name='Honey'), 700::numeric, 850::numeric, 450::numeric, 100, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'A', true, true),
  ('Litchi Honey 1kg', 'লিচু ফুলের মধু ১ কেজি', 'রাজশাহীর লিচু ফুলের সুগন্ধি মধু', (SELECT id FROM new_cats WHERE name='Honey'), 950::numeric, 1100::numeric, 600::numeric, 60, 'https://images.unsplash.com/photo-1582126892906-5ba111b943f6?w=800&q=80&auto=format&fit=crop', '1 kg', 'kg', 'A', true, false),
  ('Black Seed Honey 500g', 'কালিজিরা ফুলের মধু ৫০০ গ্রাম', 'ঔষধি গুণসম্পন্ন কালিজিরা ফুলের মধু', (SELECT id FROM new_cats WHERE name='Honey'), 600::numeric, 750::numeric, 380::numeric, 80, 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800&q=80&auto=format&fit=crop', '500 g', 'g', 'Premium', true, false)
) AS v(name, name_bn, description_bn, category_id, price, compare_price, cost_price, stock, image_url, weight, unit, grade, is_active, is_featured);

-- ---------------------------------------------------------------------
-- STEP 51/68  (20260511071837)
-- ---------------------------------------------------------------------
-- Add 'vendor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendors table
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_name text NOT NULL,
  shop_name_bn text NOT NULL,
  shop_slug text NOT NULL UNIQUE,
  logo_url text,
  banner_url text,
  description text,
  owner_name text NOT NULL,
  nid_number text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  facebook_url text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid,
  commission_percent numeric NOT NULL DEFAULT 10,
  total_orders integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_commission_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE UNIQUE INDEX idx_vendors_nid ON public.vendors(nid_number);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can submit vendor registration"
ON public.vendors FOR INSERT
WITH CHECK (status = 'pending' AND auth.uid() = user_id);

CREATE POLICY "Users can view own vendor record"
ON public.vendors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending vendor record"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Public can view approved vendors"
ON public.vendors FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all vendors"
ON public.vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all vendors"
ON public.vendors FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vendors"
ON public.vendors FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for vendor logos in product-images bucket
CREATE POLICY "Vendor logos publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'vendor-logos');

CREATE POLICY "Authenticated users can upload vendor logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update vendor logos they uploaded"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vendor logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);

-- ---------------------------------------------------------------------
-- STEP 52/68  (20260511073658)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'Sapahar Shop', updated_at = now() WHERE key = 'company_name';

-- ---------------------------------------------------------------------
-- STEP 53/68  (20260511074013)
-- ---------------------------------------------------------------------
-- ============================================
-- PRODUCTS: add vendor_id and vendor_status
-- ============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_status text NOT NULL DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON public.products(vendor_status);

-- Existing public select policy needs to also require approved vendor_status
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true AND vendor_status = 'approved');

-- Vendors manage their own products (new ones start as pending)
CREATE POLICY "Vendors can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
    AND vendor_status = 'pending'
  );

CREATE POLICY "Vendors can update own products"
  ON public.products FOR UPDATE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

CREATE POLICY "Vendors can delete own products"
  ON public.products FOR DELETE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

CREATE POLICY "Vendors can view own products regardless of status"
  ON public.products FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )
  );

-- ============================================
-- ORDER_ITEMS: add vendor + commission columns
-- ============================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_payout_amount numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON public.order_items(vendor_id);

-- Auto-fill vendor + commission snapshot on insert
CREATE OR REPLACE FUNCTION public.set_order_item_vendor_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_commission_pct numeric;
  v_line_total numeric;
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.vendor_id IS NULL THEN
    SELECT p.vendor_id INTO v_vendor_id
    FROM public.products p WHERE p.id = NEW.product_id;
    NEW.vendor_id := v_vendor_id;
  END IF;

  IF NEW.vendor_id IS NOT NULL AND (NEW.commission_percent IS NULL OR NEW.commission_percent = 0) THEN
    SELECT v.commission_percent INTO v_commission_pct
    FROM public.vendors v WHERE v.id = NEW.vendor_id;
    NEW.commission_percent := COALESCE(v_commission_pct, 0);
  END IF;

  v_line_total := COALESCE(NEW.price, 0) * COALESCE(NEW.quantity, 0);
  NEW.commission_amount := ROUND(v_line_total * COALESCE(NEW.commission_percent, 0) / 100.0, 2);
  NEW.vendor_payout_amount := v_line_total - NEW.commission_amount;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_vendor_commission ON public.order_items;
CREATE TRIGGER trg_order_items_vendor_commission
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_item_vendor_commission();

-- Vendors can view their own order items
CREATE POLICY "Vendors can view own order items"
  ON public.order_items FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = order_items.vendor_id AND v.user_id = auth.uid()
    )
  );

-- ============================================
-- VENDOR_SETTINGS: payout details per vendor
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  bank_name text,
  bank_branch text,
  account_holder text,
  account_number text,
  routing_number text,
  bkash_number text,
  nagad_number text,
  rocket_number text,
  preferred_method text NOT NULL DEFAULT 'bkash',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own settings"
  ON public.vendor_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can insert own settings"
  ON public.vendor_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can update own settings"
  ON public.vendor_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Admins can view all vendor settings"
  ON public.vendor_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all vendor settings"
  ON public.vendor_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor settings"
  ON public.vendor_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_vendor_settings_updated_at
BEFORE UPDATE ON public.vendor_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VENDOR_PAYOUTS: withdrawal requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'bkash',
  payout_account text,
  transaction_ref text,
  vendor_notes text,
  admin_notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON public.vendor_payouts(status);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own payouts"
  ON public.vendor_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can request payouts"
  ON public.vendor_payouts FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved')
  );

CREATE POLICY "Admins can view all payouts"
  ON public.vendor_payouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payouts"
  ON public.vendor_payouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payouts"
  ON public.vendor_payouts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_vendor_payouts_updated_at
BEFORE UPDATE ON public.vendor_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 54/68  (20260512040047)
-- ---------------------------------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS suggested_price_per_kg numeric DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS pricing_note text;

UPDATE public.categories SET suggested_price_per_kg = 250, pricing_note = 'প্রতি কেজি ২৩০-২৮০ টাকা (গুণমান অনুযায়ী)' WHERE name_bn = 'আম্রপালি আম';
UPDATE public.categories SET suggested_price_per_kg = 200, pricing_note = 'প্রতি কেজি ১৮০-২২০ টাকা' WHERE name_bn = 'ন্যাংরা আম';
UPDATE public.categories SET suggested_price_per_kg = 700, pricing_note = 'প্রতি কেজি ৬০০-১২০০ টাকা (জাত অনুযায়ী)' WHERE name_bn = 'খেজুর';
UPDATE public.categories SET suggested_price_per_kg = 800, pricing_note = 'প্রতি কেজি ৭০০-১০০০ টাকা (খাঁটি মধু)' WHERE name_bn = 'মধু';

-- ---------------------------------------------------------------------
-- STEP 55/68  (20260512040331)
-- ---------------------------------------------------------------------
INSERT INTO public.products (name, name_bn, description_bn, price, compare_price, stock, weight, category_id, vendor_id, vendor_status, is_active, unit)
VALUES
('Premium Amrapali Mango', 'প্রিমিয়াম আম্রপালি আম', 'মেহেদী আমের বাগান থেকে সরাসরি প্রিমিয়াম আম্রপালি। মিষ্টি, রসালো ও পরিপূর্ণ পাকা।', 260, 320, 100, '5kg', 'ff4ecd7c-d7aa-4fa8-8137-402972e9611c', '89855548-451c-4a11-8408-50d4a778ab7d', 'approved', true, 'kg'),
('Fresh Langra Mango', 'টাটকা ন্যাংরা আম', 'রাজশাহীর বিখ্যাত ন্যাংরা আম। সুমিষ্ট স্বাদ ও মন মাতানো ঘ্রাণ।', 210, 250, 80, '5kg', 'aec9db2b-101d-4fd0-8111-53fb9a3d09e2', '89855548-451c-4a11-8408-50d4a778ab7d', 'approved', true, 'kg'),
('Pure Sundarbans Honey', 'খাঁটি সুন্দরবনের মধু', '১০০% খাঁটি সুন্দরবনের প্রাকৃতিক মধু। কোনো ভেজাল নেই।', 850, 1000, 30, '1kg', '47065dd6-986c-4a00-bce4-8518f107e7cc', '89855548-451c-4a11-8408-50d4a778ab7d', 'approved', true, 'kg'),
('Premium Ajwa Dates', 'প্রিমিয়াম আজওয়া খেজুর', 'সৌদি আরবের আসল আজওয়া খেজুর। প্রিমিয়াম মানের।', 1200, 1500, 25, '1kg', 'd9ca9eb0-75ce-4084-b5f9-8edcf7f9978d', '89855548-451c-4a11-8408-50d4a778ab7d', 'approved', true, 'kg');

-- ---------------------------------------------------------------------
-- STEP 56/68  (20260512165251)
-- ---------------------------------------------------------------------
-- 1) Column-level privilege hardening for anonymous visitors
REVOKE SELECT (cost_price) ON public.products FROM anon;
REVOKE SELECT (nid_number, email, phone, address, commission_percent, total_revenue, total_commission_earned, owner_name) ON public.vendors FROM anon;
REVOKE SELECT (contact_info) ON public.customer_reviews FROM anon;

-- 2) Storage: drop overly broad public listing policies on product-images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor logos publicly viewable" ON storage.objects;
-- Files in the public bucket remain accessible by direct URL via the storage CDN; we only remove API-level listing.

-- 3) Tighten "always true" insert policies on orders / order_items
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NULL AND o.user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND (o.user_id IS NULL OR o.user_id = auth.uid()))
      )
  )
);

-- 4) Revoke EXECUTE on internal/trigger SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_cancel() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_item_delete() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_order_item_vendor_commission() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_landing_page_stats() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
-- has_role is used inside RLS policy expressions (evaluated with table owner privileges); clients don't need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------
-- STEP 57/68  (20260512165349)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- STEP 58/68  (20260512165445)
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_orders_by_email(text) FROM anon;

-- ---------------------------------------------------------------------
-- STEP 59/68  (20260512165835)
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 60/68  (20260513050822)
-- ---------------------------------------------------------------------
-- 1. Add WhatsApp number column to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Create the main "Sapahar Shop" vendor (official store) if not exists
INSERT INTO public.vendors (
  user_id, shop_name, shop_name_bn, shop_slug, owner_name, email, phone, whatsapp_number,
  nid_number, division, district, upazila, address, status, commission_percent,
  description, approved_at, approved_by
)
SELECT
  'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid,
  'Sapahar Shop', 'সাপাহার শপ', 'sapahar-shop',
  'Sapahar Shop Official',
  'support@sapaharshop.com', '+8801720565997', '+8801720565997',
  'OFFICIAL', 'রাজশাহী', 'নওগাঁ', 'সাপাহার',
  'সাপাহার, নওগাঁ, রাজশাহী',
  'approved', 0,
  'Sapahar Shop — সাপাহারের সেরা ও খাঁটি আম, লিচু, মধু ও খেজুর সরাসরি বাগান থেকে। ১০০% অরিজিনাল ও রাসায়নিকমুক্ত।',
  now(), 'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.vendors WHERE shop_slug = 'sapahar-shop');

-- 3. Backfill: assign all NULL vendor_id products to main vendor
UPDATE public.products
SET vendor_id = (SELECT id FROM public.vendors WHERE shop_slug = 'sapahar-shop' LIMIT 1),
    updated_at = now()
WHERE vendor_id IS NULL;

-- 4. Add main shop fallback WhatsApp in site_settings
INSERT INTO public.site_settings (key, value, label)
VALUES ('company_whatsapp', '+8801720565997', 'Main Shop WhatsApp Number')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 61/68  (20260604091838)
-- ---------------------------------------------------------------------
create or replace function public.admin_get_vendor_activity(_vendor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_auth jsonb;
  v_orders int := 0;
  v_products int := 0;
  v_last_order timestamptz;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'unauthorized';
  end if;

  select user_id into v_user_id from public.vendors where id = _vendor_id;
  if v_user_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'email', u.email,
    'phone', u.phone,
    'last_sign_in_at', u.last_sign_in_at,
    'created_at', u.created_at,
    'email_confirmed_at', u.email_confirmed_at,
    'raw_user_meta_data', u.raw_user_meta_data,
    'provider', u.raw_app_meta_data->>'provider',
    'providers', u.raw_app_meta_data->'providers'
  ) into v_auth
  from auth.users u where u.id = v_user_id;

  select count(*) into v_products from public.products where vendor_id = _vendor_id;

  select count(*), max(created_at) into v_orders, v_last_order
  from public.order_items where vendor_id = _vendor_id;

  return jsonb_build_object(
    'auth', v_auth,
    'products_count', v_products,
    'orders_count', v_orders,
    'last_order_at', v_last_order
  );
end;
$$;

grant execute on function public.admin_get_vendor_activity(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- STEP 62/68  (20260604093254)
-- ---------------------------------------------------------------------
-- Add vendor_id to landing_pages so vendors can own their own pages
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS vendor_id uuid;

-- Unique slug per-vendor (admin pages have vendor_id IS NULL and remain globally unique via existing slug index)
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_vendor_slug_unique
  ON public.landing_pages (vendor_id, slug)
  WHERE vendor_id IS NOT NULL;

-- Vendor RLS policies
DROP POLICY IF EXISTS "Vendors can view own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can view own landing pages"
  ON public.landing_pages FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can insert own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can insert own landing pages"
  ON public.landing_pages FOR INSERT
  WITH CHECK (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id
        AND v.user_id = auth.uid()
        AND v.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Vendors can update own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can update own landing pages"
  ON public.landing_pages FOR UPDATE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can delete own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can delete own landing pages"
  ON public.landing_pages FOR DELETE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

-- Real-time slug availability check (per vendor)
CREATE OR REPLACE FUNCTION public.check_vendor_landing_slug_available(_vendor_id uuid, _slug text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.landing_pages
    WHERE vendor_id = _vendor_id
      AND slug = lower(trim(_slug))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_vendor_landing_slug_available(uuid, text, uuid) TO authenticated;

-- Public lookup for /{vendor-slug}/{custom-slug}
CREATE OR REPLACE FUNCTION public.lookup_vendor_landing_page(_vendor_slug text, _custom_slug text)
RETURNS SETOF public.landing_pages
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.* FROM public.landing_pages lp
  JOIN public.vendors v ON v.id = lp.vendor_id
  WHERE v.shop_slug = lower(trim(_vendor_slug))
    AND v.status = 'approved'
    AND lp.slug = lower(trim(_custom_slug))
    AND lp.status = 'published'
    AND (lp.publish_at IS NULL OR lp.publish_at <= now())
    AND (lp.expire_at IS NULL OR lp.expire_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_vendor_landing_page(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 63/68  (20260604094239)
-- ---------------------------------------------------------------------
-- 1. Add serial_number column (per-vendor sequence) to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serial_number integer;

-- 2. Backfill: per-vendor serial ordered by created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at, id) AS rn
  FROM public.products
)
UPDATE public.products p SET serial_number = r.rn
FROM ranked r WHERE r.id = p.id AND p.serial_number IS NULL;

-- 3. Trigger to auto-assign serial on insert (per-vendor; null vendor gets global)
CREATE OR REPLACE FUNCTION public.assign_product_serial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next integer;
BEGIN
  IF NEW.serial_number IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.vendor_id IS NULL THEN
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id IS NULL;
  ELSE
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id = NEW.vendor_id;
  END IF;
  NEW.serial_number := v_next;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_product_serial ON public.products;
CREATE TRIGGER trg_assign_product_serial
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.assign_product_serial();

-- 4. Unique index per vendor
CREATE UNIQUE INDEX IF NOT EXISTS products_vendor_serial_unique
  ON public.products (vendor_id, serial_number)
  WHERE vendor_id IS NOT NULL;

-- 5. Lookup RPC: vendor slug + serial -> product row
CREATE OR REPLACE FUNCTION public.lookup_product_by_vendor_serial(_vendor_slug text, _serial integer)
RETURNS SETOF public.products
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id
  WHERE v.shop_slug = lower(trim(_vendor_slug))
    AND p.serial_number = _serial
    AND p.is_active = true
    AND p.vendor_status = 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_product_by_vendor_serial(text, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 64/68  (20260611053449)
-- ---------------------------------------------------------------------
-- Threads
CREATE TABLE public.vendor_support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  subject text,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_admin integer NOT NULL DEFAULT 0,
  unread_vendor integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vst_vendor_idx ON public.vendor_support_threads(vendor_id);
CREATE INDEX vst_last_msg_idx ON public.vendor_support_threads(last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_threads TO authenticated;
GRANT ALL ON public.vendor_support_threads TO service_role;
ALTER TABLE public.vendor_support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own support threads" ON public.vendor_support_threads
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors create own support threads" ON public.vendor_support_threads
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
              OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors update own threads" ON public.vendor_support_threads
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete threads" ON public.vendor_support_threads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER vst_updated_at BEFORE UPDATE ON public.vendor_support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.vendor_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.vendor_support_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('vendor','admin','system')),
  sender_id uuid,
  sender_name text,
  body text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vsm_thread_idx ON public.vendor_support_messages(thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_messages TO authenticated;
GRANT ALL ON public.vendor_support_messages TO service_role;
ALTER TABLE public.vendor_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view thread messages" ON public.vendor_support_messages
  FOR SELECT TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members send messages" ON public.vendor_support_messages
  FOR INSERT TO authenticated
  WITH CHECK (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members update read state" ON public.vendor_support_messages
  FOR UPDATE TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to bump thread metadata on new message
CREATE OR REPLACE FUNCTION public.touch_vendor_support_thread()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.vendor_support_threads
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.body, 200),
      unread_admin = CASE WHEN NEW.sender_role = 'vendor' THEN unread_admin + 1 ELSE unread_admin END,
      unread_vendor = CASE WHEN NEW.sender_role = 'admin' THEN unread_vendor + 1 ELSE unread_vendor END,
      updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;

CREATE TRIGGER vsm_touch_thread AFTER INSERT ON public.vendor_support_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_vendor_support_thread();

-- Notifications
CREATE TABLE public.vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vn_vendor_idx ON public.vendor_notifications(vendor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own notifications" ON public.vendor_notifications
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors mark own notifications" ON public.vendor_notifications
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins create notifications" ON public.vendor_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete notifications" ON public.vendor_notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- STEP 65/68  (20260615055651)
-- ---------------------------------------------------------------------
CREATE TABLE public.promo_strips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  alt_text TEXT,
  position TEXT NOT NULL DEFAULT 'top' CHECK (position IN ('top','bottom')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_strips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_strips TO authenticated;
GRANT ALL ON public.promo_strips TO service_role;

ALTER TABLE public.promo_strips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo strips"
  ON public.promo_strips FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert promo strips"
  ON public.promo_strips FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo strips"
  ON public.promo_strips FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promo strips"
  ON public.promo_strips FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promo_strips_updated_at
  BEFORE UPDATE ON public.promo_strips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Demo banner (1600x200 thin promo strip)
INSERT INTO public.promo_strips (image_url, link_url, alt_text, position, sort_order, is_active)
VALUES
  ('https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1600&q=80&auto=format&fit=crop', '/products', 'বিশেষ অফার — সাপাহারের সেরা আম', 'top', 0, true),
  ('https://images.unsplash.com/photo-1553279768-865429fa0078?w=1600&q=80&auto=format&fit=crop', '/products', 'ফ্রি ডেলিভারি অফার', 'bottom', 0, true);

-- ---------------------------------------------------------------------
-- STEP 66/68  (20260615060709)
-- ---------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS requires_advance_payment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percent NUMERIC NOT NULL DEFAULT 50 CHECK (advance_percent >= 0 AND advance_percent <= 100);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- STEP 67/68  (20260615063948)
-- ---------------------------------------------------------------------
-- 1) payment_accounts
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  account_number text NOT NULL,
  account_type text NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','merchant','agent')),
  logo_url text,
  instructions_bn text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment accounts"
  ON public.payment_accounts FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payment accounts"
  ON public.payment_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_accounts_updated
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_sender_number text,
  ADD COLUMN IF NOT EXISTS payment_txn_id text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_expected_amount numeric,
  ADD COLUMN IF NOT EXISTS advance_paid boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_payment_match
  ON public.orders (payment_provider, payment_sender_number, payment_expected_amount)
  WHERE payment_verified_at IS NULL;

-- 3) sms_inbox
CREATE TABLE IF NOT EXISTS public.sms_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message text NOT NULL,
  sender_address text,
  provider text,
  amount numeric,
  txn_id text,
  sender_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  matched_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_at timestamptz,
  status text NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','duplicate','invalid')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_inbox TO authenticated;
GRANT ALL ON public.sms_inbox TO service_role;

ALTER TABLE public.sms_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all sms"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read sms for their orders"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (
    matched_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = sms_inbox.matched_order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage sms"
  ON public.sms_inbox FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_sms_inbox_match ON public.sms_inbox (status, amount, sender_number);
CREATE INDEX IF NOT EXISTS idx_sms_inbox_received ON public.sms_inbox (received_at DESC);

-- 4) Webhook secret in site_settings (insert if missing)
INSERT INTO public.site_settings (key, value)
SELECT 'sms_webhook_secret', encode(gen_random_bytes(24), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'sms_webhook_secret');

-- 5) Seed default payment accounts (only if table empty)
INSERT INTO public.payment_accounts (method, account_number, account_type, instructions_bn, sort_order)
SELECT * FROM (VALUES
  ('bkash','01700000000','personal','bKash অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → Transaction ID কপি করুন',1),
  ('nagad','01800000000','personal','Nagad অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',2),
  ('rocket','017000000000','personal','Rocket অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',3)
) AS v(method, account_number, account_type, instructions_bn, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.payment_accounts);

-- ---------------------------------------------------------------------
-- STEP 68/68  (20260615071511)
-- ---------------------------------------------------------------------
-- Allow customers to update their own order's payment fields while unverified
CREATE POLICY "Users update own pending order payment"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND payment_verified_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- FINAL STEP — PROMOTE YOUR ADMIN USER
-- ---------------------------------------------------------------------
-- Sign up through the app first, then run this with your own email:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
--
-- To make a vendor account: role = 'vendor'
-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
