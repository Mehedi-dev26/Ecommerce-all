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