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
