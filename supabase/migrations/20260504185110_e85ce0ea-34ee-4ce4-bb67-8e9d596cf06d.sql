
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
