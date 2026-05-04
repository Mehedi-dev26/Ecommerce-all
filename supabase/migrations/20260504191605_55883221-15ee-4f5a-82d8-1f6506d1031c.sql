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
