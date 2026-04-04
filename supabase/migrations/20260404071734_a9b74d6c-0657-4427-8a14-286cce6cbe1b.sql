
-- Rename Himsagar to Lychee
UPDATE products SET 
  name = 'Rajshahi Lychee',
  name_bn = 'রাজশাহীর লিচি',
  description = 'Rajshahi is famous for producing the finest lychees in Bangladesh. Our fresh Rajshahi lychees are handpicked at peak ripeness, offering an incredibly sweet and juicy flavor. Each fruit is carefully selected to ensure the best quality, bringing the authentic taste of Rajshahi orchards directly to your home.',
  description_bn = 'রাজশাহী বাংলাদেশের সবচেয়ে সুস্বাদু লিচির জন্য বিখ্যাত। আমাদের তাজা রাজশাহীর লিচি পরিপূর্ণ পাকা অবস্থায় হাতে বাছাই করা হয়, যা অবিশ্বাস্য রকম মিষ্টি ও রসালো স্বাদ দেয়। প্রতিটি ফল সর্বোচ্চ মান নিশ্চিত করে যত্নের সাথে বাছাই করা হয়, রাজশাহীর বাগানের খাঁটি স্বাদ সরাসরি আপনার ঘরে পৌঁছে দেয়।'
WHERE id = 'ea0ac68e-44db-40fa-b771-ed8acd041031';

-- Make all products featured so they show in homepage
UPDATE products SET is_featured = true WHERE is_featured = false;
