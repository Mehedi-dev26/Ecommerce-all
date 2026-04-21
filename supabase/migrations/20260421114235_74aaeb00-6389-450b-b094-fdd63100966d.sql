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