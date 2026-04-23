UPDATE site_settings SET value = '+880 1779-80168' WHERE key = 'footer_phone';
UPDATE site_settings SET value = 'surzoshop@gmail.com' WHERE key = 'footer_email';
UPDATE site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
UPDATE site_settings SET value = '© {year} Surzo Shop — স্বল্প মূল্যে সেরা পণ্য। সর্বস্বত্ব সংরক্ষিত।' WHERE key = 'footer_copyright';

INSERT INTO site_settings (key, value, label) VALUES
  ('footer_instagram', '#', 'ইনস্টাগ্রাম লিংক'),
  ('footer_youtube', '#', 'ইউটিউব লিংক')
ON CONFLICT (key) DO NOTHING;