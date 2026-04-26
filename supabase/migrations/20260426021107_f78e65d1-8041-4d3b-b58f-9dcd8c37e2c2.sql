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