
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  weight TEXT,
  unit TEXT DEFAULT 'piece',
  stock INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  notes TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products: public read
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Orders: anyone can insert, select by phone
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders by phone" ON public.orders FOR SELECT USING (true);

-- Order items: public read
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, name_bn, description, sort_order) VALUES
('Pickles', 'আচার', 'Traditional Bangladeshi pickles made with authentic recipes', 1),
('Fruits', 'ফল', 'Fresh seasonal fruits from Bangladesh', 2),
('Oils', 'তেল', 'Pure and natural cooking oils', 3),
('Dry Foods', 'শুকনো খাবার', 'Premium quality dry foods and spices', 4),
('Honey & Dates', 'মধু ও খেজুর', 'Natural honey and premium dates', 5);

-- Seed products
INSERT INTO public.products (category_id, name, name_bn, description, description_bn, price, compare_price, weight, unit, stock, is_featured) VALUES
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Mango Pickle', 'আমের আচার', 'Authentic homemade mango pickle with traditional spices', 'ঘরে তৈরি খাঁটি আমের আচার, দেশি মসলা দিয়ে তৈরি', 350, 400, '500g', 'jar', 50, true),
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Tamarind Pickle', 'তেঁতুলের আচার', 'Tangy tamarind pickle made with fresh tamarind', 'টাটকা তেঁতুল দিয়ে তৈরি টক আচার', 300, null, '500g', 'jar', 40, true),
((SELECT id FROM public.categories WHERE name = 'Pickles'), 'Garlic Pickle', 'রসুনের আচার', 'Spicy garlic pickle with mustard oil', 'সরিষার তেলে তৈরি ঝাল রসুনের আচার', 320, 380, '500g', 'jar', 35, false),
((SELECT id FROM public.categories WHERE name = 'Fruits'), 'Rajshahi Mango (Himsagar)', 'রাজশাহীর আম (হিমসাগর)', 'Premium Himsagar mangoes from Rajshahi', 'রাজশাহীর প্রিমিয়াম হিমসাগর আম', 1200, 1500, '5kg', 'box', 100, true),
((SELECT id FROM public.categories WHERE name = 'Fruits'), 'Langra Mango', 'ল্যাংড়া আম', 'Sweet and aromatic Langra mangoes', 'মিষ্টি ও সুগন্ধি ল্যাংড়া আম', 1000, null, '5kg', 'box', 80, false),
((SELECT id FROM public.categories WHERE name = 'Oils'), 'Pure Mustard Oil', 'খাঁটি সরিষার তেল', '100% pure cold-pressed mustard oil from local farms', '১০০% খাঁটি ঘানি ভাঙ্গা সরিষার তেল', 450, 550, '1L', 'bottle', 60, true),
((SELECT id FROM public.categories WHERE name = 'Oils'), 'Coconut Oil', 'নারিকেল তেল', 'Virgin coconut oil, naturally extracted', 'প্রাকৃতিক উপায়ে নিষ্কাশিত নারিকেল তেল', 500, null, '500ml', 'bottle', 30, false),
((SELECT id FROM public.categories WHERE name = 'Dry Foods'), 'Dried Fish (Shutki)', 'শুটকি মাছ', 'Premium quality sun-dried fish', 'প্রিমিয়াম মানের রোদে শুকানো শুটকি', 800, 950, '500g', 'pack', 25, true),
((SELECT id FROM public.categories WHERE name = 'Honey & Dates'), 'Sundarbans Honey', 'সুন্দরবনের মধু', 'Pure honey collected from Sundarbans', 'সুন্দরবন থেকে সংগৃহীত খাঁটি মধু', 700, 850, '500g', 'jar', 45, true),
((SELECT id FROM public.categories WHERE name = 'Honey & Dates'), 'Ajwa Dates', 'আজওয়া খেজুর', 'Premium Ajwa dates from Saudi Arabia', 'সৌদি আরব থেকে আনা প্রিমিয়াম আজওয়া খেজুর', 1500, 1800, '1kg', 'box', 20, true);
