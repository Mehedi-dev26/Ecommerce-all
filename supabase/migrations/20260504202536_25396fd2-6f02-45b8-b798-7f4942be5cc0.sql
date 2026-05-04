
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
