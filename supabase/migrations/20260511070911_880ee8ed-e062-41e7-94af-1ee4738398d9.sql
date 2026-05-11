
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
