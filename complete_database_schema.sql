-- =====================================================================
-- SAPAHAR SHOP — COMPLETE DATABASE SCHEMA (CONSOLIDATED)
-- Generated: 2026-09-22
-- Source: all 68 migrations, in chronological order.
-- =====================================================================
-- This single file recreates the ENTIRE backend: enums, tables, grants,
-- RLS policies, functions, triggers, storage buckets, realtime config
-- and seed data for a fresh Supabase / Lovable Cloud project.
--
-- HOW TO USE
--   1. New Supabase project -> SQL Editor -> New query
--   2. Paste this whole file -> Run (run it ONCE, top to bottom)
--   3. Put the new SUPABASE_URL + ANON/PUBLISHABLE KEY in your .env
--   4. Re-add edge function secrets:
--        LOVABLE_API_KEY, PATHAO_*, STEADFAST (in courier_providers),
--        GMAIL_USER / GMAIL_APP_PASSWORD (or RESEND_API_KEY)
--   5. Deploy edge functions: guest-auth, vendor-signup, pathao,
--        steadfast, steadfast-webhook, sms-webhook, send-email,
--        support-chat, vendor-support-ai, admin-ai-assistant
--   6. Sign up your admin user, then promote them (see the very bottom)
--
-- TABLES INCLUDED
--   user_roles, profiles, categories, products, banners, promo_strips,
--   courier_charges, courier_providers, saved_addresses, landing_pages,
--   orders, order_items, abandoned_checkouts, customer_reviews,
--   site_settings, email_templates, email_logs, payment_accounts,
--   sms_inbox, business_expenses, inventory_purchases,
--   vendors, vendor_settings, vendor_payouts, vendor_notifications,
--   vendor_support_threads, vendor_support_messages
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums are created up-front so later policies can use every value
-- (Postgres forbids using an enum value added in the same transaction).
DO $enum$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'vendor');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;


-- ---------------------------------------------------------------------
-- STEP 01/68  (20260404055349)
-- ---------------------------------------------------------------------
-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.orders (
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
CREATE TABLE IF NOT EXISTS public.order_items (
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
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products: public read
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Orders: anyone can insert, select by phone
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.orders;
CREATE POLICY "Anyone can view orders by phone" ON public.orders FOR SELECT USING (true);

-- Order items: public read
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
-- (demo data removed)


-- Seed products
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 02/68  (20260404063210)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- (demo data removed)


-- (demo data removed)


-- (demo data removed)


-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 03/68  (20260404071259)
-- ---------------------------------------------------------------------
-- Mustard Oil
-- (demo data removed)


-- Mango Pickle (2 images)
-- (demo data removed)


-- Garlic Pickle
-- (demo data removed)


-- Langra Mango
-- (demo data removed)


-- Tamarind Pickle (using black cumin pickle image as closest match)
-- (demo data removed)


-- Rajshahi Mango Himsagar (using lychee tree image - fruit on tree)
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 04/68  (20260404071734)
-- ---------------------------------------------------------------------
-- Rename Himsagar to Lychee
-- (demo data removed)


-- Make all products featured so they show in homepage
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 05/68  (20260404071852)
-- ---------------------------------------------------------------------
-- (demo data removed)

-- (demo data removed)

-- (demo data removed)

-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 06/68  (20260406082449)
-- ---------------------------------------------------------------------
-- First delete all existing order_items and orders to avoid FK issues
-- (demo data removed)

-- (demo data removed)


-- Delete all existing products
-- (demo data removed)


-- Delete all existing categories
-- (demo data removed)


-- Insert mango categories
-- (demo data removed)


-- Insert mango products (2 per category = 12 products)
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 07/68  (20260406084019)
-- ---------------------------------------------------------------------
-- Create app_role enum
-- app_role enum already created at the top of this file (includes 'vendor')

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for orders (update status)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- STEP 08/68  (20260409160516)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text DEFAULT 'অর্ডার করুন',
  cta_link text DEFAULT '/products',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 09/68  (20260409161243)
-- ---------------------------------------------------------------------
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  default_division text,
  default_district text,
  default_upazila text,
  default_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to orders for linking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 10/68  (20260409194332)
-- ---------------------------------------------------------------------
-- Add Pathao tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pathao_consignment_id text,
  ADD COLUMN IF NOT EXISTS pathao_order_status text,
  ADD COLUMN IF NOT EXISTS pathao_tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders(pathao_consignment_id) WHERE pathao_consignment_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- STEP 11/68  (20260410095359)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text,
  customer_phone text,
  customer_email text,
  division text,
  district text,
  upazila text,
  shipping_address text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  user_id uuid,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can view all abandoned checkouts"
ON public.abandoned_checkouts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update own abandoned checkout" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can update own abandoned checkout"
ON public.abandoned_checkouts FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Admins can delete abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can delete abandoned checkouts"
ON public.abandoned_checkouts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_abandoned_checkouts_updated_at ON public.abandoned_checkouts;
CREATE TRIGGER update_abandoned_checkouts_updated_at
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 12/68  (20260410101209)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;
CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default footer settings
INSERT INTO public.site_settings (key, value, label) VALUES
  ('footer_phone', '+880 1798-268989', 'ফোন নম্বর'),
  ('footer_email', 'info@sapaharmango.com', 'ইমেইল'),
  ('footer_location', 'সাপাহার, নওগাঁ, বাংলাদেশ', 'ঠিকানা'),
  ('footer_facebook', '#', 'ফেসবুক লিংক'),
  ('footer_copyright', '© {year} Sapahar Mango — সাপাহারের দেশি আম। সর্বস্বত্ব সংরক্ষিত।', 'কপিরাইট টেক্সট');

-- ---------------------------------------------------------------------
-- STEP 13/68  (20260410102350)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courier_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  district text NOT NULL,
  upazila text,
  charge_per_kg numeric NOT NULL DEFAULT 0,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(division, district, upazila)
);

ALTER TABLE public.courier_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view courier charges" ON public.courier_charges;
CREATE POLICY "Anyone can view courier charges"
ON public.courier_charges FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert courier charges" ON public.courier_charges;
CREATE POLICY "Admins can insert courier charges"
ON public.courier_charges FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update courier charges" ON public.courier_charges;
CREATE POLICY "Admins can update courier charges"
ON public.courier_charges FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete courier charges" ON public.courier_charges;
CREATE POLICY "Admins can delete courier charges"
ON public.courier_charges FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_courier_charges_updated_at ON public.courier_charges;
CREATE TRIGGER update_courier_charges_updated_at
BEFORE UPDATE ON public.courier_charges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 14/68  (20260410105536)
-- ---------------------------------------------------------------------
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS show_text_overlay boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------
-- STEP 15/68  (20260421053532)
-- ---------------------------------------------------------------------
-- Wipe old mango data
-- (demo data removed)

-- (demo data removed)

-- (demo data removed)

-- (demo data removed)

-- (demo data removed)


-- Insert new categories
-- (demo data removed)


-- Insert new products
-- (demo data removed)


-- Insert new banners
-- (demo data removed)


-- Update site settings
UPDATE site_settings SET value = '+880 1700-000000' WHERE key = 'footer_phone';
UPDATE site_settings SET value = 'info@surzoshop.com' WHERE key = 'footer_email';
UPDATE site_settings SET value = 'ঢাকা, বাংলাদেশ' WHERE key = 'footer_location';
UPDATE site_settings SET value = '© {year} Surzo Shop — সেরা পণ্য, সেরা দামে। সর্বস্বত্ব সংরক্ষিত।' WHERE key = 'footer_copyright';

-- ---------------------------------------------------------------------
-- STEP 16/68  (20260421113215)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
INSERT INTO public.site_settings (key, value, label)
SELECT 'footer_location', 'আশুরন্দ বাজার, সাপাহার, নওগাঁ', 'ঠিকানা'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'footer_location');

-- ---------------------------------------------------------------------
-- STEP 17/68  (20260421114235)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_reviews (
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

DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.customer_reviews;
CREATE POLICY "Anyone can view active reviews" ON public.customer_reviews
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.customer_reviews;
CREATE POLICY "Admins can view all reviews" ON public.customer_reviews
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert reviews" ON public.customer_reviews;
CREATE POLICY "Admins can insert reviews" ON public.customer_reviews
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update reviews" ON public.customer_reviews;
CREATE POLICY "Admins can update reviews" ON public.customer_reviews
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.customer_reviews;
CREATE POLICY "Admins can delete reviews" ON public.customer_reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_customer_reviews_updated_at ON public.customer_reviews;
CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON public.customer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 18/68  (20260421115257)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 19/68  (20260421115531)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 20/68  (20260422101234)
-- ---------------------------------------------------------------------
-- Allow anonymous and authenticated users to insert/update their abandoned checkout records
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;

DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ---------------------------------------------------------------------
-- STEP 21/68  (20260422105229)
-- ---------------------------------------------------------------------
-- Saved addresses for logged-in customers (Daraz-style address book)
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'বাসা',
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own addresses" ON public.saved_addresses;
CREATE POLICY "Users can view own addresses"
ON public.saved_addresses FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.saved_addresses;
CREATE POLICY "Users can insert own addresses"
ON public.saved_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.saved_addresses;
CREATE POLICY "Users can update own addresses"
ON public.saved_addresses FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.saved_addresses;
CREATE POLICY "Users can delete own addresses"
ON public.saved_addresses FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all addresses" ON public.saved_addresses;
CREATE POLICY "Admins can view all addresses"
ON public.saved_addresses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);

DROP TRIGGER IF EXISTS update_saved_addresses_updated_at ON public.saved_addresses;
CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON public.saved_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 22/68  (20260422122049)
-- ---------------------------------------------------------------------
-- Add grade column to products (nullable so existing products unaffected).
-- Allowed grades include premium plus/minus variants used by the shop (A+, A, A-, B+, ...).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS grade TEXT;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_grade_check;
-- grade: free text, no check constraint


-- Add a flag to categories so admin can mark which categories need a weight field
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS requires_weight BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- STEP 23/68  (20260422123147)
-- ---------------------------------------------------------------------
-- Add approval workflow columns to customer_reviews
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS submitted_by_customer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Mark all existing reviews as approved so they keep showing
-- (demo data removed)


-- Drop old public SELECT policy and recreate with status filter
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.customer_reviews;

DROP POLICY IF EXISTS "Anyone can view approved active reviews" ON public.customer_reviews;
CREATE POLICY "Anyone can view approved active reviews"
  ON public.customer_reviews
  FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Allow anyone (guest or authenticated) to submit a new review
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.customer_reviews;
CREATE POLICY "Anyone can submit reviews"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND submitted_by_customer = true
    AND is_active = false
  );

-- Index for fast admin filtering by status
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);

-- ---------------------------------------------------------------------
-- STEP 24/68  (20260422124514)
-- ---------------------------------------------------------------------
-- Add product_id and review_images to customer_reviews so reviews can be tied to specific products
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS product_id uuid NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS review_images text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_id
  ON public.customer_reviews(product_id);

-- Allow public uploads of review images into the existing product-images bucket under "reviews/" prefix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can upload review images'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
CREATE POLICY "Anyone can upload review images"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'reviews');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read product images'
  ) THEN
    DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- STEP 25/68  (20260423011046)
-- ---------------------------------------------------------------------
UPDATE site_settings SET value = '+880 1779-80168' WHERE key = 'footer_phone';
UPDATE site_settings SET value = 'surzoshop@gmail.com' WHERE key = 'footer_email';
UPDATE site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
UPDATE site_settings SET value = '© {year} Surzo Shop — স্বল্প মূল্যে সেরা পণ্য। সর্বস্বত্ব সংরক্ষিত।' WHERE key = 'footer_copyright';

INSERT INTO site_settings (key, value, label) VALUES
  ('footer_instagram', '#', 'ইনস্টাগ্রাম লিংক'),
  ('footer_youtube', '#', 'ইউটিউব লিংক')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 26/68  (20260423105946)
-- ---------------------------------------------------------------------
-- ============================================
-- AUTO STOCK MANAGEMENT SYSTEM
-- ============================================

-- 1. Function: Decrement stock when order item is inserted
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
  product_name_val text;
BEGIN
  -- Skip if no product_id (manual/custom items)
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock the product row to prevent race conditions
  SELECT stock, name_bn INTO current_stock, product_name_val
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- If product not found, allow (it might be deleted)
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Check if enough stock available
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'দুঃখিত! "%" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান স্টক: %, অর্ডার পরিমাণ: %',
      product_name_val, current_stock, NEW.quantity
      USING ERRCODE = 'P0001';
  END IF;

  -- Decrement stock atomically
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

-- 2. Function: Restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes TO 'cancelled' (not from cancelled)
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- Re-deduct if order is uncancelled (status moves away from 'cancelled')
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock - oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Function: Restore stock if order_items are deleted (e.g., order deleted)
CREATE OR REPLACE FUNCTION public.restore_stock_on_item_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_status text;
BEGIN
  IF OLD.product_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Only restore if the parent order wasn't already cancelled (which already restored)
  SELECT status INTO parent_status FROM public.orders WHERE id = OLD.order_id;

  IF parent_status IS NULL OR parent_status <> 'cancelled' THEN
    UPDATE public.products
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$$;

-- 4. Triggers
DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_item ON public.order_items;
DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_stock_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

DROP TRIGGER IF EXISTS trg_restore_stock_on_order_cancel ON public.orders;
DROP TRIGGER IF EXISTS trg_restore_stock_on_order_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

DROP TRIGGER IF EXISTS trg_restore_stock_on_item_delete ON public.order_items;
DROP TRIGGER IF EXISTS trg_restore_stock_on_item_delete ON public.order_items;
CREATE TRIGGER trg_restore_stock_on_item_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_item_delete();

-- ---------------------------------------------------------------------
-- STEP 27/68  (20260424105714)
-- ---------------------------------------------------------------------
-- ============================================
-- Landing Pages Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- URL & Status
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
  
  -- Basic Info
  title TEXT NOT NULL,
  meta_description TEXT,
  
  -- Theme
  theme_preset TEXT NOT NULL DEFAULT 'mango_yellow',
  
  -- Hero Section
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'এখনই অর্ডার করুন',
  
  -- Products (array of { product_id, special_price?, position })
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Bundle pricing
  enable_bundle BOOLEAN NOT NULL DEFAULT false,
  bundle_discount_percent NUMERIC DEFAULT 0,
  bundle_label TEXT,
  
  -- Content sections
  bullet_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  long_description TEXT,
  faq_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  trust_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Reviews to feature (array of customer_review IDs)
  featured_review_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Conversion elements
  countdown_enabled BOOLEAN NOT NULL DEFAULT false,
  countdown_end_at TIMESTAMPTZ,
  stock_counter_enabled BOOLEAN NOT NULL DEFAULT false,
  stock_counter_value INTEGER,
  
  -- Tracking
  facebook_pixel_id TEXT,
  
  -- Analytics counters
  view_count INTEGER NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  
  -- Schedule
  publish_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast slug lookup
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view published pages within schedule
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.landing_pages;
CREATE POLICY "Public can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (
  status = 'published'
  AND (publish_at IS NULL OR publish_at <= now())
  AND (expire_at IS NULL OR expire_at > now())
);

-- RLS: Admins can view all
DROP POLICY IF EXISTS "Admins can view all landing pages" ON public.landing_pages;
CREATE POLICY "Admins can view all landing pages"
ON public.landing_pages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can insert
DROP POLICY IF EXISTS "Admins can insert landing pages" ON public.landing_pages;
CREATE POLICY "Admins can insert landing pages"
ON public.landing_pages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can update
DROP POLICY IF EXISTS "Admins can update landing pages" ON public.landing_pages;
CREATE POLICY "Admins can update landing pages"
ON public.landing_pages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can delete
DROP POLICY IF EXISTS "Admins can delete landing pages" ON public.landing_pages;
CREATE POLICY "Admins can delete landing pages"
ON public.landing_pages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Add landing_page_id to orders for attribution
-- ============================================
ALTER TABLE public.orders
ADD COLUMN landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_landing_page_id ON public.orders(landing_page_id);

-- ============================================
-- Public function to increment view count safely
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_landing_page_view(_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.landing_pages
  SET view_count = view_count + 1
  WHERE slug = _slug
    AND status = 'published'
    AND (publish_at IS NULL OR publish_at <= now())
    AND (expire_at IS NULL OR expire_at > now());
END;
$$;

-- Allow anonymous and authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.increment_landing_page_view(TEXT) TO anon, authenticated;

-- ============================================
-- Function to increment order count + revenue when order completes
-- ============================================
CREATE OR REPLACE FUNCTION public.update_landing_page_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On new order with landing_page_id
  IF TG_OP = 'INSERT' AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = order_count + 1,
        total_revenue = total_revenue + COALESCE(NEW.total, 0)
    WHERE id = NEW.landing_page_id;
  END IF;
  
  -- If order is cancelled, decrement
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = GREATEST(order_count - 1, 0),
        total_revenue = GREATEST(total_revenue - COALESCE(NEW.total, 0), 0)
    WHERE id = NEW.landing_page_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS landing_page_order_stats ON public.orders;
CREATE TRIGGER landing_page_order_stats
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_landing_page_stats();

-- ---------------------------------------------------------------------
-- STEP 28/68  (20260424113524)
-- ---------------------------------------------------------------------
-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view templates" ON public.email_templates;
CREATE POLICY "Admins can view templates" ON public.email_templates
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert templates" ON public.email_templates;
CREATE POLICY "Admins can insert templates" ON public.email_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update templates" ON public.email_templates;
CREATE POLICY "Admins can update templates" ON public.email_templates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete templates" ON public.email_templates;
CREATE POLICY "Admins can delete templates" ON public.email_templates
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role) AND is_system = false);

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body text,
  template_key text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  gmail_message_id text,
  related_order_id uuid,
  related_user_id uuid,
  sent_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;
CREATE POLICY "Anyone can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete email logs" ON public.email_logs;
CREATE POLICY "Admins can delete email logs" ON public.email_logs
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.email_logs(related_order_id) WHERE related_order_id IS NOT NULL;

-- Seed 5 bilingual professional email templates
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_system) VALUES
('welcome_signup', 'Welcome / স্বাগতম', 'নতুন signup এর জন্য welcome email', 'স্বাগতম {{site_name}} পরিবারে! 🎉',
'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">স্বাগতম! 🎉</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:16px;">Welcome to {{site_name}}</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;color:#0f172a;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">আপনাকে আমাদের পরিবারে স্বাগতম জানাচ্ছি! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন থেকে আপনি আমাদের সকল সেবা উপভোগ করতে পারবেন।</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;">Dear {{customer_name}}, welcome to our family! Your account has been created successfully. You can now enjoy all our services.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:16px 20px;border-radius:8px;">
<p style="margin:0 0 8px;font-weight:600;color:#0f766e;">✨ আপনি পাবেন:</p>
<ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
<li>সেরা মানের পণ্য সরাসরি আপনার দোরগোড়ায়</li>
<li>দ্রুত ডেলিভারি সারা বাংলাদেশে</li>
<li>বিশেষ ছাড় ও অফার</li>
<li>২৪/৭ কাস্টমার সাপোর্ট</li>
</ul></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);border-radius:8px;">
<a href="https://{{site_url}}/products" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">এখনই কেনাকাটা শুরু করুন →</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন: <a href="mailto:{{company_email}}" style="color:#0d9488;text-decoration:none;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}} — সর্বস্বত্ব সংরক্ষিত</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_confirmation', 'Order Confirmation / অর্ডার নিশ্চিতকরণ', 'অর্ডার দেয়ার সাথে সাথে পাঠানো হয়', '✅ আপনার অর্ডার পেয়েছি — {{order_code}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 30px;text-align:center;">
<div style="background:#ffffff;width:64px;height:64px;border-radius:50%;display:inline-block;line-height:64px;font-size:32px;margin-bottom:12px;">✅</div>
<h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">অর্ডার নিশ্চিত হয়েছে!</h1>
<p style="color:#d1fae5;margin:8px 0 0;font-size:15px;">Order Confirmed Successfully</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 8px;">আসসালামু আলাইকুম <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারটি আমরা সফলভাবে পেয়েছি। নিচে আপনার অর্ডারের সম্পূর্ণ বিবরণ দেওয়া হলো।</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:12px;padding:20px;margin:0 0 24px;"><tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0;font-size:22px;font-weight:700;color:#0f766e;">{{order_code}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">📦 আপনার পণ্য</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:2px solid #e2e8f0;padding-top:16px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি চার্জ:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:12px 0 6px;font-size:17px;font-weight:700;border-top:1px solid #e2e8f0;">মোট:</td><td align="right" style="padding:12px 0 6px;font-size:20px;font-weight:700;color:#0d9488;border-top:1px solid #e2e8f0;">৳ {{order_total}}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0 0 6px;font-weight:600;color:#92400e;">🚚 ডেলিভারি ঠিকানা</p>
<p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">{{shipping_address}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে। ধন্যবাদ আমাদের উপর আস্থা রাখার জন্য! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 প্রশ্ন থাকলে: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('first_order_thanks', 'First Order Thanks / প্রথম অর্ডার ধন্যবাদ', 'প্রথমবার অর্ডারকারী customer-কে বিশেষ ধন্যবাদ', '🎁 ধন্যবাদ আপনার প্রথম অর্ডারের জন্য, {{customer_name}}!',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:50px 30px;text-align:center;">
<div style="font-size:56px;margin-bottom:8px;">🎁</div>
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">অসংখ্য ধন্যবাদ!</h1>
<p style="color:#fef3c7;margin:8px 0 0;font-size:16px;">Thank You for Your First Order</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.8;color:#475569;margin:0 0 16px;">আপনার <strong>প্রথম অর্ডারটি</strong> আমাদের জন্য অনেক বিশেষ! আপনি আমাদের উপর বিশ্বাস রেখেছেন বলে আমরা কৃতজ্ঞ। 💚</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;font-style:italic;">Your first order means a lot to us. Thank you for trusting {{site_name}}!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7,#fed7aa);border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 8px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:600;">আপনার অর্ডার</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#9a3412;">{{order_code}}</p>
<p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#7c2d12;">৳ {{order_total}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">🎉 আপনার জন্য বিশেষ সুবিধা:</h3>
<ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
<li>পরের অর্ডারে <strong>বিশেষ ছাড়</strong> পেতে আমাদের সাথে থাকুন</li>
<li>নতুন পণ্যের আপডেট সবার আগে জানুন</li>
<li>VIP কাস্টমার হিসেবে অগ্রাধিকার সেবা</li>
</ul>
<p style="font-size:14px;line-height:1.7;color:#475569;margin:16px 0 0;">আপনার ফিডব্যাক আমাদের কাছে অমূল্য। অর্ডার পেয়ে আপনার অভিজ্ঞতা আমাদের জানাতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">💚 আপনার বিশ্বাসের জন্য আবারও ধন্যবাদ</p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_status_update', 'Order Status Update / অর্ডার স্ট্যাটাস', 'Admin status পরিবর্তন করলে পাঠানো হয়', '📦 আপনার অর্ডার {{order_code}} এখন: {{order_status}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<div style="font-size:48px;margin-bottom:8px;">📦</div>
<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">অর্ডার স্ট্যাটাস আপডেট</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:14px;">Order Status Update</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারের স্ট্যাটাস পরিবর্তন হয়েছে। বিস্তারিত নিচে দেওয়া হলো:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:2px solid #14b8a6;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#134e4a;">{{order_code}}</p>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">বর্তমান স্ট্যাটাস</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#0d9488;text-transform:capitalize;">{{order_status}}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-left:4px solid #facc15;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">💬 <strong>বার্তা:</strong> {{status_message}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না। আপনার পাশে আছি! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 যোগাযোগ: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('custom_admin', 'Custom Admin Email / কাস্টম ইমেইল', 'Admin থেকে customer-কে কাস্টম মেসেজ', '{{custom_subject}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:32px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{site_name}}</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 20px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<div style="font-size:15px;line-height:1.8;color:#334155;">{{custom_message}}</div>
<p style="font-size:14px;color:#64748b;margin:32px 0 0;">শুভকামনায়,<br/><strong>{{site_name}} টিম</strong></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true);

-- Default site_settings for email branding
INSERT INTO public.site_settings (key, value, label) VALUES
  ('company_name', 'Sapahar Mango', 'কোম্পানির নাম'),
  ('company_email', 'info@sapaharmango.com', 'কোম্পানির ইমেইল')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 29/68  (20260425124149)
-- ---------------------------------------------------------------------
-- Add admin notification email setting
INSERT INTO public.site_settings (key, value, label)
VALUES ('admin_notification_email', 'surzoshop@gmail.com', 'Admin Order Notification Email')
ON CONFLICT (key) DO NOTHING;

-- Add new_order_admin email template
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES (
  'new_order_admin',
  'New Order Admin Alert / নতুন অর্ডার এডমিন এলার্ট',
  'Sent to admin when a new order is placed',
  '🔔 নতুন অর্ডার #{{order_code}} - ৳{{order_total}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:24px;color:#fff;">
<h1 style="margin:0;font-size:22px;">🔔 নতুন অর্ডার এসেছে!</h1>
<p style="margin:6px 0 0;opacity:0.9;font-size:14px;">New Order Notification — {{site_name}}</p>
</td></tr>
<tr><td style="padding:24px;">
<div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:6px;margin-bottom:20px;">
<p style="margin:0;font-size:13px;color:#475569;">অর্ডার নম্বর / Order #</p>
<p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0891b2;">{{order_code}}</p>
</div>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">গ্রাহকের তথ্য / Customer Details</h3>
<table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#334155;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="border-bottom:1px solid #e2e8f0;width:140px;color:#64748b;">নাম / Name</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_name}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ফোন / Phone</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_phone}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ইমেইল / Email</td><td style="border-bottom:1px solid #e2e8f0;">{{customer_email}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;vertical-align:top;">ঠিকানা / Address</td><td style="border-bottom:1px solid #e2e8f0;">{{shipping_address}}</td></tr>
<tr><td style="color:#64748b;">পেমেন্ট / Payment</td><td style="font-weight:600;text-transform:uppercase;">{{payment_method}}</td></tr>
</table>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">পণ্য / Items</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল / Subtotal</td><td align="right" style="padding:6px 0;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি / Shipping</td><td align="right" style="padding:6px 0;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">মোট / Total</td><td align="right" style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">৳ {{order_total}}</td></tr>
</table>
<div style="text-align:center;margin-top:24px;">
<a href="https://{{site_url}}/admin/orders" style="display:inline-block;background:#0891b2;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার দেখুন / View Order</a>
</div>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:12px;">
এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে — {{site_name}} Admin System
</td></tr>
</table>
</td></tr></table></body></html>',
  true,
  true
)
ON CONFLICT (template_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 30/68  (20260425125036)
-- ---------------------------------------------------------------------
-- Add 5 new ready-to-use email templates for admin

INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES
-- 1. Shipping notification
(
  'order_shipped',
  'Order Shipped / অর্ডার পাঠানো হয়েছে',
  'Notify customer that order has been shipped via courier',
  '🚚 আপনার অর্ডার #{{order_code}} পাঠানো হয়েছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#fbbf24);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🚚 অর্ডার পাঠানো হয়েছে!</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your order is on the way</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">আপনার অর্ডার <strong style="color:#f59e0b;">#{{order_code}}</strong> কুরিয়ারে পাঠানো হয়েছে এবং খুব শীঘ্রই আপনার ঠিকানায় পৌঁছে যাবে। ইনশাআল্লাহ্‌।</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:6px;margin:20px 0;">
<p style="margin:0 0 6px;font-size:13px;color:#78350f;">ট্র্যাকিং নম্বর / Tracking ID</p>
<p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">{{tracking_id}}</p>
</div>
<p style="font-size:14px;color:#475569;line-height:1.7;">কুরিয়ার: <strong>{{courier_name}}</strong><br/>প্রত্যাশিত ডেলিভারি: <strong>{{delivery_date}}</strong></p>
<div style="text-align:center;margin:28px 0;">
<a href="{{tracking_url}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">ট্র্যাক করুন / Track Order</a>
</div>
<p style="font-size:13px;color:#94a3b8;text-align:center;margin:20px 0 0;">কোনো প্রশ্ন থাকলে যোগাযোগ করুন: {{company_email}}</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — তাজা ফলের নিশ্চয়তা
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 2. Order delivered
(
  'order_delivered',
  'Order Delivered / অর্ডার ডেলিভার হয়েছে',
  'Confirmation when order is successfully delivered',
  '✅ অর্ডার #{{order_code}} ডেলিভার সম্পন্ন — ধন্যবাদ!',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:36px;text-align:center;color:#fff;">
<div style="font-size:48px;margin-bottom:8px;">✅</div>
<h1 style="margin:0;font-size:24px;">ডেলিভারি সম্পন্ন!</h1>
<p style="margin:6px 0 0;opacity:0.95;">Order Delivered Successfully</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার অর্ডার <strong>#{{order_code}}</strong> সফলভাবে ডেলিভার হয়েছে। আমাদের সেবা পছন্দ হয়েছে কিনা জানাতে ভুলবেন না!</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:#166534;font-weight:600;">আপনার অভিজ্ঞতা শেয়ার করুন</p>
<a href="https://{{site_url}}/products" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">রিভিউ দিন / Leave a Review</a>
</div>
<p style="font-size:13px;color:#64748b;line-height:1.6;text-align:center;margin:20px 0 0;">আপনার ভরসায় আমরা কৃতজ্ঞ। আবার অর্ডার করতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — সাপাহারের সেরা আম
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 3. Abandoned cart recovery
(
  'abandoned_cart',
  'Abandoned Cart Recovery / কার্ট রিকভারি',
  'Remind customer about items left in cart',
  '🛒 আপনার কার্টে কিছু রয়ে গেছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fef9f3;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🛒 কিছু ভুলে গেছেন?</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your cart is waiting for you</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনি কিছু পছন্দের পণ্য কার্টে রেখে চলে গেছেন। এগুলো শেষ হওয়ার আগেই অর্ডার সম্পন্ন করুন!</p>
{{items_html}}
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px;border-radius:6px;margin:20px 0;">
<p style="margin:0;font-size:13px;color:#991b1b;">⚡ স্টক সীমিত — দ্রুত অর্ডার করুন</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/cart" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার সম্পন্ন করুন / Complete Order</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 4. Promo / Discount offer
(
  'promo_offer',
  'Promo Offer / বিশেষ অফার',
  'Send special discount or seasonal offer to customer',
  '🎁 বিশেষ অফার আপনার জন্য — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fdf4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#9333ea,#c026d3);padding:36px;text-align:center;color:#fff;">
<div style="font-size:42px;margin-bottom:8px;">🎁</div>
<h1 style="margin:0;font-size:26px;">{{offer_title}}</h1>
<p style="margin:8px 0 0;opacity:0.95;font-size:14px;">{{offer_subtitle}}</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">{{offer_body}}</p>
<div style="background:linear-gradient(135deg,#fdf4ff,#fae8ff);border:2px dashed #9333ea;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
<p style="margin:0 0 6px;font-size:13px;color:#6b21a8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">কুপন কোড</p>
<p style="margin:0;font-size:28px;font-weight:800;color:#9333ea;letter-spacing:3px;">{{coupon_code}}</p>
<p style="margin:10px 0 0;font-size:12px;color:#6b21a8;">মেয়াদ: {{expiry_date}}</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#9333ea;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">এখনই কিনুন / Shop Now</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 5. Review request
(
  'review_request',
  'Review Request / রিভিউ অনুরোধ',
  'Ask customer for a product review after delivery',
  '⭐ আপনার মতামত জানাতে ভুলবেন না — অর্ডার #{{order_code}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fffbeb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#eab308,#facc15);padding:36px;text-align:center;color:#0f172a;">
<div style="font-size:42px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
<h1 style="margin:0;font-size:24px;">আপনার রিভিউ দরকার!</h1>
<p style="margin:8px 0 0;opacity:0.85;">Share your experience</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার সাম্প্রতিক অর্ডার <strong>#{{order_code}}</strong> এর অভিজ্ঞতা কেমন ছিল? একটি সংক্ষিপ্ত রিভিউ দিয়ে অন্য গ্রাহকদেরও সাহায্য করুন।</p>
<div style="background:#fef3c7;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0;font-size:14px;color:#78350f;font-weight:600;">আপনার মতামত আমাদের কাছে অমূল্য</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#eab308;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">রিভিউ দিন / Write Review</a>
</div>
<p style="font-size:12px;color:#94a3b8;text-align:center;margin:16px 0 0;">এক মিনিটেরও কম সময় লাগবে</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
)
ON CONFLICT (template_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 31/68  (20260425164040)
-- ---------------------------------------------------------------------
-- Add cost_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- Inventory purchases table (records each stock purchase batch)
CREATE TABLE IF NOT EXISTS public.inventory_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  supplier_name text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view inventory purchases" ON public.inventory_purchases;
CREATE POLICY "Admins can view inventory purchases"
ON public.inventory_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert inventory purchases" ON public.inventory_purchases;
CREATE POLICY "Admins can insert inventory purchases"
ON public.inventory_purchases FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update inventory purchases" ON public.inventory_purchases;
CREATE POLICY "Admins can update inventory purchases"
ON public.inventory_purchases FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete inventory purchases" ON public.inventory_purchases;
CREATE POLICY "Admins can delete inventory purchases"
ON public.inventory_purchases FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_inventory_purchases_updated_at ON public.inventory_purchases;
CREATE TRIGGER update_inventory_purchases_updated_at
BEFORE UPDATE ON public.inventory_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business expenses table (general expenses: rent, marketing, transport, etc.)
CREATE TABLE IF NOT EXISTS public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view business expenses" ON public.business_expenses;
CREATE POLICY "Admins can view business expenses"
ON public.business_expenses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert business expenses" ON public.business_expenses;
CREATE POLICY "Admins can insert business expenses"
ON public.business_expenses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update business expenses" ON public.business_expenses;
CREATE POLICY "Admins can update business expenses"
ON public.business_expenses FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete business expenses" ON public.business_expenses;
CREATE POLICY "Admins can delete business expenses"
ON public.business_expenses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_business_expenses_updated_at ON public.business_expenses;
CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 32/68  (20260426021107)
-- ---------------------------------------------------------------------
-- Sample Landing Page 1: Smartphone Combo (3 products, full features)
-- (demo data removed)


-- Sample Landing Page 2: Premium Single Product (Samsung A23)
-- (demo data removed)


-- Sample Landing Page 3: Budget Combo (2 products, urgency-focused)
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 33/68  (20260426022059)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 34/68  (20260501041844)
-- ---------------------------------------------------------------------
UPDATE site_settings SET value='01725391686' WHERE key='footer_phone';
UPDATE site_settings SET value='https://www.facebook.com/profile.php?id=61550473965187' WHERE key='footer_facebook';

-- ---------------------------------------------------------------------
-- STEP 35/68  (20260504184103)
-- ---------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'upnex360@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 36/68  (20260504184159)
-- ---------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- STEP 37/68  (20260504185110)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- STEP 38/68  (20260504190347)
-- ---------------------------------------------------------------------
-- Insert Mango category
-- (demo data removed)


-- Insert products referencing mango category
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 39/68  (20260504190945)
-- ---------------------------------------------------------------------
-- Additional categories
-- (demo data removed)


-- Insert additional mango varieties + new products
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 40/68  (20260504191605)
-- ---------------------------------------------------------------------
-- Wipe existing catalog (mango-only business)
-- (demo data removed)

-- (demo data removed)

-- (demo data removed)


-- Add 4 mango variety categories
-- (demo data removed)


-- Add one premium product per category
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 41/68  (20260504192839)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'Sapahar Mango Shop — সাপাহারের সেরা ও সুস্বাদু আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়। ১০০% খাঁটি, রাসায়নিকমুক্ত।', updated_at = now() WHERE key = 'footer_about';

UPDATE public.site_settings SET value = '© {year} Sapahar Mango Shop — সাপাহারের খাঁটি আমের নির্ভরযোগ্য ঠিকানা। সর্বস্বত্ব সংরক্ষিত।', updated_at = now() WHERE key = 'footer_copyright';

UPDATE public.site_settings SET value = 'সাপাহার বাজার, সাপাহার, নওগাঁ', updated_at = now() WHERE key = 'footer_location';

-- ---------------------------------------------------------------------
-- STEP 42/68  (20260504194040)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 43/68  (20260504202536)
-- ---------------------------------------------------------------------
-- New categories
-- (demo data removed)


-- Products
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 44/68  (20260506112041)
-- ---------------------------------------------------------------------
-- Courier providers table
CREATE TABLE IF NOT EXISTS public.courier_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view courier providers" ON public.courier_providers;
CREATE POLICY "Admins can view courier providers"
  ON public.courier_providers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert courier providers" ON public.courier_providers;
CREATE POLICY "Admins can insert courier providers"
  ON public.courier_providers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update courier providers" ON public.courier_providers;
CREATE POLICY "Admins can update courier providers"
  ON public.courier_providers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete courier providers" ON public.courier_providers;
CREATE POLICY "Admins can delete courier providers"
  ON public.courier_providers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS courier_providers_updated_at ON public.courier_providers;
CREATE TRIGGER courier_providers_updated_at
  BEFORE UPDATE ON public.courier_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default rows (empty creds — admin fills via UI; env fallback exists for Pathao)
INSERT INTO public.courier_providers (provider_key, display_name, is_active, is_default, sort_order, credentials)
VALUES
  ('pathao', 'Pathao', true, true, 1, '{"base_url":"https://api-hermes.pathao.com"}'::jsonb),
  ('steadfast', 'Steadfast', false, false, 2, '{"base_url":"https://portal.packzy.com/api/v1"}'::jsonb);

-- Add courier tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_provider TEXT,
  ADD COLUMN IF NOT EXISTS courier_tracking_id TEXT;

-- ---------------------------------------------------------------------
-- STEP 45/68  (20260506122107)
-- ---------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- STEP 46/68  (20260508134742)
-- ---------------------------------------------------------------------
-- 1) ORDERS: drop public SELECT, add owner + admin SELECT
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.orders;

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2) ORDER_ITEMS: drop public SELECT, restrict to owner/admin
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id IS NOT NULL
        AND o.user_id = auth.uid()
    )
  );

-- 3) ABANDONED_CHECKOUTS: scope insert/update to the owning auth user
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;

DROP POLICY IF EXISTS "Users can insert own abandoned checkout" ON public.abandoned_checkouts;
CREATE POLICY "Users can insert own abandoned checkout"
  ON public.abandoned_checkouts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own abandoned checkout" ON public.abandoned_checkouts;
CREATE POLICY "Users can update own abandoned checkout"
  ON public.abandoned_checkouts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can update abandoned checkouts"
  ON public.abandoned_checkouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (true);

-- 4) EMAIL_LOGS: remove public insert; service role bypasses RLS for the edge function
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;

-- 5) PRODUCTS: hide cost_price from public clients via column-level grants
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, name_bn, description, description_bn, category_id, price, compare_price, stock, image_url, images, weight, unit, grade, is_active, is_featured, created_at, updated_at, coming_soon)
  ON public.products TO anon, authenticated;
-- Admins (which use the same authenticated role + has_role check via RLS) need cost_price too;
-- grant cost_price to authenticated only — RLS still gates row access, and the column is only
-- read in the admin panel which runs as authenticated.
GRANT SELECT (cost_price) ON public.products TO authenticated;

-- 6) STORAGE: remove broad SELECT policy that allows listing the product-images bucket.
-- Public CDN downloads still work because the bucket is public.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- 7) Helper RPC: generate next sequential order number (replaces client-side count of all orders)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.orders;
  RETURN 'SM-' || LPAD(next_num::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated;

-- 8) Helper RPC: lookup an order by order_number + customer_phone (for guest tracking)
CREATE OR REPLACE FUNCTION public.lookup_order_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  order_number text,
  total numeric,
  subtotal numeric,
  shipping_cost numeric,
  status text,
  created_at timestamptz,
  city text,
  district text,
  payment_method text,
  shipping_address text,
  pathao_consignment_id text,
  pathao_order_status text,
  pathao_tracking_url text,
  delivery_fee numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.total, o.subtotal, o.shipping_cost, o.status,
         o.created_at, o.city, o.district, o.payment_method, o.shipping_address,
         o.pathao_consignment_id, o.pathao_order_status, o.pathao_tracking_url, o.delivery_fee
  FROM public.orders o
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_order_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_number(text, text) TO anon, authenticated;

-- 9) Helper RPC: count orders for a customer email (used to detect first-time customer)
CREATE OR REPLACE FUNCTION public.count_orders_by_email(_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.orders WHERE customer_email = _email
$$;

REVOKE ALL ON FUNCTION public.count_orders_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_orders_by_email(text) TO anon, authenticated;

-- 10) Helper RPC: lookup order items by order_number + customer_phone (paired with #8)
CREATE OR REPLACE FUNCTION public.lookup_order_items_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_name text,
  quantity integer,
  price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
$$;

REVOKE ALL ON FUNCTION public.lookup_order_items_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_items_by_number(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 47/68  (20260508135910)
-- ---------------------------------------------------------------------
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- STEP 48/68  (20260509073732)
-- ---------------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES ('product_frame_url', '/brand/product-frame.png') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value) VALUES ('product_frame_inset', '{"left":0.1196,"top":0.2329,"right":0.874,"bottom":0.8238}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ---------------------------------------------------------------------
-- STEP 49/68  (20260511065902)
-- ---------------------------------------------------------------------
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'mehediwork@gmail.com' AND email_confirmed_at IS NULL;
INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'mehediwork@gmail.com' ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 50/68  (20260511070911)
-- ---------------------------------------------------------------------
-- Categories
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 51/68  (20260511071837)
-- ---------------------------------------------------------------------
-- Add 'vendor' to app_role enum
-- 'vendor' value is already part of app_role (created at the top of this file)

-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_name text NOT NULL,
  shop_name_bn text NOT NULL,
  shop_slug text NOT NULL UNIQUE,
  logo_url text,
  banner_url text,
  description text,
  owner_name text NOT NULL,
  nid_number text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  facebook_url text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid,
  commission_percent numeric NOT NULL DEFAULT 10,
  total_orders integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_commission_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_nid ON public.vendors(nid_number);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can submit vendor registration" ON public.vendors;
CREATE POLICY "Anyone can submit vendor registration"
ON public.vendors FOR INSERT
WITH CHECK (status = 'pending' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own vendor record" ON public.vendors;
CREATE POLICY "Users can view own vendor record"
ON public.vendors FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending vendor record" ON public.vendors;
CREATE POLICY "Users can update own pending vendor record"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;
CREATE POLICY "Public can view approved vendors"
ON public.vendors FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
CREATE POLICY "Admins can view all vendors"
ON public.vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all vendors" ON public.vendors;
CREATE POLICY "Admins can update all vendors"
ON public.vendors FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;
CREATE POLICY "Admins can delete vendors"
ON public.vendors FOR DELETE
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- updated_at trigger
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for vendor logos in product-images bucket
DROP POLICY IF EXISTS "Vendor logos publicly viewable" ON storage.objects;
CREATE POLICY "Vendor logos publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'vendor-logos');

DROP POLICY IF EXISTS "Authenticated users can upload vendor logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendor logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can update vendor logos they uploaded" ON storage.objects;
CREATE POLICY "Users can update vendor logos they uploaded"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Admins can delete vendor logos" ON storage.objects;
CREATE POLICY "Admins can delete vendor logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);

-- ---------------------------------------------------------------------
-- STEP 52/68  (20260511073658)
-- ---------------------------------------------------------------------
UPDATE public.site_settings SET value = 'Sapahar Shop', updated_at = now() WHERE key = 'company_name';

-- ---------------------------------------------------------------------
-- STEP 53/68  (20260511074013)
-- ---------------------------------------------------------------------
-- ============================================
-- PRODUCTS: add vendor_id and vendor_status
-- ============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_status text NOT NULL DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON public.products(vendor_status);

-- Existing public select policy needs to also require approved vendor_status
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true AND vendor_status = 'approved');

-- Vendors manage their own products (new ones start as pending)
DROP POLICY IF EXISTS "Vendors can insert own products" ON public.products;
CREATE POLICY "Vendors can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
    AND vendor_status = 'pending'
  );

DROP POLICY IF EXISTS "Vendors can update own products" ON public.products;
CREATE POLICY "Vendors can update own products"
  ON public.products FOR UPDATE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Vendors can delete own products" ON public.products;
CREATE POLICY "Vendors can delete own products"
  ON public.products FOR DELETE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Vendors can view own products regardless of status" ON public.products;
CREATE POLICY "Vendors can view own products regardless of status"
  ON public.products FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )
  );

-- ============================================
-- ORDER_ITEMS: add vendor + commission columns
-- ============================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_payout_amount numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON public.order_items(vendor_id);

-- Auto-fill vendor + commission snapshot on insert
CREATE OR REPLACE FUNCTION public.set_order_item_vendor_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_commission_pct numeric;
  v_line_total numeric;
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.vendor_id IS NULL THEN
    SELECT p.vendor_id INTO v_vendor_id
    FROM public.products p WHERE p.id = NEW.product_id;
    NEW.vendor_id := v_vendor_id;
  END IF;

  IF NEW.vendor_id IS NOT NULL AND (NEW.commission_percent IS NULL OR NEW.commission_percent = 0) THEN
    SELECT v.commission_percent INTO v_commission_pct
    FROM public.vendors v WHERE v.id = NEW.vendor_id;
    NEW.commission_percent := COALESCE(v_commission_pct, 0);
  END IF;

  v_line_total := COALESCE(NEW.price, 0) * COALESCE(NEW.quantity, 0);
  NEW.commission_amount := ROUND(v_line_total * COALESCE(NEW.commission_percent, 0) / 100.0, 2);
  NEW.vendor_payout_amount := v_line_total - NEW.commission_amount;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_vendor_commission ON public.order_items;
DROP TRIGGER IF EXISTS trg_order_items_vendor_commission ON public.order_items;
CREATE TRIGGER trg_order_items_vendor_commission
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_item_vendor_commission();

-- Vendors can view their own order items
DROP POLICY IF EXISTS "Vendors can view own order items" ON public.order_items;
CREATE POLICY "Vendors can view own order items"
  ON public.order_items FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = order_items.vendor_id AND v.user_id = auth.uid()
    )
  );

-- ============================================
-- VENDOR_SETTINGS: payout details per vendor
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  bank_name text,
  bank_branch text,
  account_holder text,
  account_number text,
  routing_number text,
  bkash_number text,
  nagad_number text,
  rocket_number text,
  preferred_method text NOT NULL DEFAULT 'bkash',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own settings" ON public.vendor_settings;
CREATE POLICY "Vendors can view own settings"
  ON public.vendor_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "Vendors can insert own settings" ON public.vendor_settings;
CREATE POLICY "Vendors can insert own settings"
  ON public.vendor_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "Vendors can update own settings" ON public.vendor_settings;
CREATE POLICY "Vendors can update own settings"
  ON public.vendor_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all vendor settings" ON public.vendor_settings;
CREATE POLICY "Admins can view all vendor settings"
  ON public.vendor_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all vendor settings" ON public.vendor_settings;
CREATE POLICY "Admins can update all vendor settings"
  ON public.vendor_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete vendor settings" ON public.vendor_settings;
CREATE POLICY "Admins can delete vendor settings"
  ON public.vendor_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_vendor_settings_updated_at ON public.vendor_settings;
CREATE TRIGGER update_vendor_settings_updated_at
BEFORE UPDATE ON public.vendor_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VENDOR_PAYOUTS: withdrawal requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'bkash',
  payout_account text,
  transaction_ref text,
  vendor_notes text,
  admin_notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON public.vendor_payouts(status);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors can view own payouts"
  ON public.vendor_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "Vendors can request payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors can request payouts"
  ON public.vendor_payouts FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved')
  );

DROP POLICY IF EXISTS "Admins can view all payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can view all payouts"
  ON public.vendor_payouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can update payouts"
  ON public.vendor_payouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can delete payouts"
  ON public.vendor_payouts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON public.vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
BEFORE UPDATE ON public.vendor_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- STEP 54/68  (20260512040047)
-- ---------------------------------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS suggested_price_per_kg numeric DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS pricing_note text;

-- (demo data removed)

-- (demo data removed)

-- (demo data removed)

-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 55/68  (20260512040331)
-- ---------------------------------------------------------------------
-- (demo data removed)


-- ---------------------------------------------------------------------
-- STEP 56/68  (20260512165251)
-- ---------------------------------------------------------------------
-- 1) Column-level privilege hardening for anonymous visitors
REVOKE SELECT (cost_price) ON public.products FROM anon;
REVOKE SELECT (nid_number, email, phone, address, commission_percent, total_revenue, total_commission_earned, owner_name) ON public.vendors FROM anon;
REVOKE SELECT (contact_info) ON public.customer_reviews FROM anon;

-- 2) Storage: drop overly broad public listing policies on product-images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor logos publicly viewable" ON storage.objects;
-- Files in the public bucket remain accessible by direct URL via the storage CDN; we only remove API-level listing.

-- 3) Tighten "always true" insert policies on orders / order_items
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NULL AND o.user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND (o.user_id IS NULL OR o.user_id = auth.uid()))
      )
  )
);

-- 4) Revoke EXECUTE on internal/trigger SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_cancel() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_item_delete() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_order_item_vendor_commission() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_landing_page_stats() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
-- has_role is used inside RLS policy expressions (evaluated with table owner privileges); clients don't need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;

-- ---------------------------------------------------------------------
-- STEP 57/68  (20260512165349)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- STEP 58/68  (20260512165445)
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_orders_by_email(text) FROM anon;

-- ---------------------------------------------------------------------
-- STEP 59/68  (20260512165835)
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 60/68  (20260513050822)
-- ---------------------------------------------------------------------
-- 1. Add WhatsApp number column to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Create the main "Sapahar Shop" vendor (official store) if not exists
INSERT INTO public.vendors (
  user_id, shop_name, shop_name_bn, shop_slug, owner_name, email, phone, whatsapp_number,
  nid_number, division, district, upazila, address, status, commission_percent,
  description, approved_at, approved_by
)
SELECT
  'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid,
  'Sapahar Shop', 'সাপাহার শপ', 'sapahar-shop',
  'Sapahar Shop Official',
  'support@sapaharshop.com', '+8801720565997', '+8801720565997',
  'OFFICIAL', 'রাজশাহী', 'নওগাঁ', 'সাপাহার',
  'সাপাহার, নওগাঁ, রাজশাহী',
  'approved', 0,
  'Sapahar Shop — সাপাহারের সেরা ও খাঁটি আম, লিচু, মধু ও খেজুর সরাসরি বাগান থেকে। ১০০% অরিজিনাল ও রাসায়নিকমুক্ত।',
  now(), 'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.vendors WHERE shop_slug = 'sapahar-shop');

-- 3. Backfill: assign all NULL vendor_id products to main vendor
-- (demo data removed)


-- 4. Add main shop fallback WhatsApp in site_settings
INSERT INTO public.site_settings (key, value, label)
VALUES ('company_whatsapp', '+8801720565997', 'Main Shop WhatsApp Number')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 61/68  (20260604091838)
-- ---------------------------------------------------------------------
create or replace function public.admin_get_vendor_activity(_vendor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_auth jsonb;
  v_orders int := 0;
  v_products int := 0;
  v_last_order timestamptz;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'unauthorized';
  end if;

  select user_id into v_user_id from public.vendors where id = _vendor_id;
  if v_user_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'email', u.email,
    'phone', u.phone,
    'last_sign_in_at', u.last_sign_in_at,
    'created_at', u.created_at,
    'email_confirmed_at', u.email_confirmed_at,
    'raw_user_meta_data', u.raw_user_meta_data,
    'provider', u.raw_app_meta_data->>'provider',
    'providers', u.raw_app_meta_data->'providers'
  ) into v_auth
  from auth.users u where u.id = v_user_id;

  select count(*) into v_products from public.products where vendor_id = _vendor_id;

  select count(*), max(created_at) into v_orders, v_last_order
  from public.order_items where vendor_id = _vendor_id;

  return jsonb_build_object(
    'auth', v_auth,
    'products_count', v_products,
    'orders_count', v_orders,
    'last_order_at', v_last_order
  );
end;
$$;

grant execute on function public.admin_get_vendor_activity(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- STEP 62/68  (20260604093254)
-- ---------------------------------------------------------------------
-- Add vendor_id to landing_pages so vendors can own their own pages
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS vendor_id uuid;

-- Unique slug per-vendor (admin pages have vendor_id IS NULL and remain globally unique via existing slug index)
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_vendor_slug_unique
  ON public.landing_pages (vendor_id, slug)
  WHERE vendor_id IS NOT NULL;

-- Vendor RLS policies
DROP POLICY IF EXISTS "Vendors can view own landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Vendors can view own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can view own landing pages"
  ON public.landing_pages FOR SELECT
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can insert own landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Vendors can insert own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can insert own landing pages"
  ON public.landing_pages FOR INSERT
  WITH CHECK (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id
        AND v.user_id = auth.uid()
        AND v.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Vendors can update own landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Vendors can update own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can update own landing pages"
  ON public.landing_pages FOR UPDATE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can delete own landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Vendors can delete own landing pages" ON public.landing_pages;
CREATE POLICY "Vendors can delete own landing pages"
  ON public.landing_pages FOR DELETE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = landing_pages.vendor_id AND v.user_id = auth.uid()
    )
  );

-- Real-time slug availability check (per vendor)
CREATE OR REPLACE FUNCTION public.check_vendor_landing_slug_available(_vendor_id uuid, _slug text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.landing_pages
    WHERE vendor_id = _vendor_id
      AND slug = lower(trim(_slug))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_vendor_landing_slug_available(uuid, text, uuid) TO authenticated;

-- Public lookup for /{vendor-slug}/{custom-slug}
CREATE OR REPLACE FUNCTION public.lookup_vendor_landing_page(_vendor_slug text, _custom_slug text)
RETURNS SETOF public.landing_pages
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lp.* FROM public.landing_pages lp
  JOIN public.vendors v ON v.id = lp.vendor_id
  WHERE v.shop_slug = lower(trim(_vendor_slug))
    AND v.status = 'approved'
    AND lp.slug = lower(trim(_custom_slug))
    AND lp.status = 'published'
    AND (lp.publish_at IS NULL OR lp.publish_at <= now())
    AND (lp.expire_at IS NULL OR lp.expire_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_vendor_landing_page(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 63/68  (20260604094239)
-- ---------------------------------------------------------------------
-- 1. Add serial_number column (per-vendor sequence) to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serial_number integer;

-- 2. Backfill: per-vendor serial ordered by created_at
-- (demo data removed)


-- 3. Trigger to auto-assign serial on insert (per-vendor; null vendor gets global)
CREATE OR REPLACE FUNCTION public.assign_product_serial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next integer;
BEGIN
  IF NEW.serial_number IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.vendor_id IS NULL THEN
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id IS NULL;
  ELSE
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id = NEW.vendor_id;
  END IF;
  NEW.serial_number := v_next;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_product_serial ON public.products;
DROP TRIGGER IF EXISTS trg_assign_product_serial ON public.products;
CREATE TRIGGER trg_assign_product_serial
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.assign_product_serial();

-- 4. Unique index per vendor
CREATE UNIQUE INDEX IF NOT EXISTS products_vendor_serial_unique
  ON public.products (vendor_id, serial_number)
  WHERE vendor_id IS NOT NULL;

-- 5. Lookup RPC: vendor slug + serial -> product row
CREATE OR REPLACE FUNCTION public.lookup_product_by_vendor_serial(_vendor_slug text, _serial integer)
RETURNS SETOF public.products
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id
  WHERE v.shop_slug = lower(trim(_vendor_slug))
    AND p.serial_number = _serial
    AND p.is_active = true
    AND p.vendor_status = 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_product_by_vendor_serial(text, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- STEP 64/68  (20260611053449)
-- ---------------------------------------------------------------------
-- Threads
CREATE TABLE IF NOT EXISTS public.vendor_support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  subject text,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_admin integer NOT NULL DEFAULT 0,
  unread_vendor integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vst_vendor_idx ON public.vendor_support_threads(vendor_id);
CREATE INDEX IF NOT EXISTS vst_last_msg_idx ON public.vendor_support_threads(last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_threads TO authenticated;
GRANT ALL ON public.vendor_support_threads TO service_role;
ALTER TABLE public.vendor_support_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view own support threads" ON public.vendor_support_threads;
CREATE POLICY "Vendors view own support threads" ON public.vendor_support_threads
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Vendors create own support threads" ON public.vendor_support_threads;
CREATE POLICY "Vendors create own support threads" ON public.vendor_support_threads
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
              OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Vendors update own threads" ON public.vendor_support_threads;
CREATE POLICY "Vendors update own threads" ON public.vendor_support_threads
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete threads" ON public.vendor_support_threads;
CREATE POLICY "Admins delete threads" ON public.vendor_support_threads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS vst_updated_at ON public.vendor_support_threads;
CREATE TRIGGER vst_updated_at BEFORE UPDATE ON public.vendor_support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE IF NOT EXISTS public.vendor_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.vendor_support_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('vendor','admin','system')),
  sender_id uuid,
  sender_name text,
  body text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vsm_thread_idx ON public.vendor_support_messages(thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_messages TO authenticated;
GRANT ALL ON public.vendor_support_messages TO service_role;
ALTER TABLE public.vendor_support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view thread messages" ON public.vendor_support_messages;
CREATE POLICY "Members view thread messages" ON public.vendor_support_messages
  FOR SELECT TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Members send messages" ON public.vendor_support_messages;
CREATE POLICY "Members send messages" ON public.vendor_support_messages
  FOR INSERT TO authenticated
  WITH CHECK (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Members update read state" ON public.vendor_support_messages;
CREATE POLICY "Members update read state" ON public.vendor_support_messages
  FOR UPDATE TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to bump thread metadata on new message
CREATE OR REPLACE FUNCTION public.touch_vendor_support_thread()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.vendor_support_threads
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.body, 200),
      unread_admin = CASE WHEN NEW.sender_role = 'vendor' THEN unread_admin + 1 ELSE unread_admin END,
      unread_vendor = CASE WHEN NEW.sender_role = 'admin' THEN unread_vendor + 1 ELSE unread_vendor END,
      updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vsm_touch_thread ON public.vendor_support_messages;
CREATE TRIGGER vsm_touch_thread AFTER INSERT ON public.vendor_support_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_vendor_support_thread();

-- Notifications
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vn_vendor_idx ON public.vendor_notifications(vendor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view own notifications" ON public.vendor_notifications;
CREATE POLICY "Vendors view own notifications" ON public.vendor_notifications
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Vendors mark own notifications" ON public.vendor_notifications;
CREATE POLICY "Vendors mark own notifications" ON public.vendor_notifications
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins create notifications" ON public.vendor_notifications;
CREATE POLICY "Admins create notifications" ON public.vendor_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete notifications" ON public.vendor_notifications;
CREATE POLICY "Admins delete notifications" ON public.vendor_notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- STEP 65/68  (20260615055651)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_strips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  alt_text TEXT,
  position TEXT NOT NULL DEFAULT 'top' CHECK (position IN ('top','bottom')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_strips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_strips TO authenticated;
GRANT ALL ON public.promo_strips TO service_role;

ALTER TABLE public.promo_strips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active promo strips" ON public.promo_strips;
CREATE POLICY "Anyone can view active promo strips"
  ON public.promo_strips FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert promo strips" ON public.promo_strips;
CREATE POLICY "Admins can insert promo strips"
  ON public.promo_strips FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update promo strips" ON public.promo_strips;
CREATE POLICY "Admins can update promo strips"
  ON public.promo_strips FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete promo strips" ON public.promo_strips;
CREATE POLICY "Admins can delete promo strips"
  ON public.promo_strips FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_promo_strips_updated_at ON public.promo_strips;
CREATE TRIGGER update_promo_strips_updated_at
  BEFORE UPDATE ON public.promo_strips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Demo banner (1600x200 thin promo strip)
INSERT INTO public.promo_strips (image_url, link_url, alt_text, position, sort_order, is_active)
VALUES
  ('https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1600&q=80&auto=format&fit=crop', '/products', 'বিশেষ অফার — সাপাহারের সেরা আম', 'top', 0, true),
  ('https://images.unsplash.com/photo-1553279768-865429fa0078?w=1600&q=80&auto=format&fit=crop', '/products', 'ফ্রি ডেলিভারি অফার', 'bottom', 0, true);

-- ---------------------------------------------------------------------
-- STEP 66/68  (20260615060709)
-- ---------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS requires_advance_payment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percent NUMERIC NOT NULL DEFAULT 50 CHECK (advance_percent >= 0 AND advance_percent <= 100);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- STEP 67/68  (20260615063948)
-- ---------------------------------------------------------------------
-- 1) payment_accounts
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  account_number text NOT NULL,
  account_type text NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','merchant','agent')),
  logo_url text,
  instructions_bn text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active payment accounts" ON public.payment_accounts;
CREATE POLICY "Anyone can view active payment accounts"
  ON public.payment_accounts FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage payment accounts" ON public.payment_accounts;
CREATE POLICY "Admins manage payment accounts"
  ON public.payment_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_payment_accounts_updated ON public.payment_accounts;
CREATE TRIGGER trg_payment_accounts_updated
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_sender_number text,
  ADD COLUMN IF NOT EXISTS payment_txn_id text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_expected_amount numeric,
  ADD COLUMN IF NOT EXISTS advance_paid boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_payment_match
  ON public.orders (payment_provider, payment_sender_number, payment_expected_amount)
  WHERE payment_verified_at IS NULL;

-- 3) sms_inbox
CREATE TABLE IF NOT EXISTS public.sms_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message text NOT NULL,
  sender_address text,
  provider text,
  amount numeric,
  txn_id text,
  sender_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  matched_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_at timestamptz,
  status text NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','duplicate','invalid')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_inbox TO authenticated;
GRANT ALL ON public.sms_inbox TO service_role;

ALTER TABLE public.sms_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read all sms" ON public.sms_inbox;
CREATE POLICY "Admins read all sms"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read sms for their orders" ON public.sms_inbox;
CREATE POLICY "Users read sms for their orders"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (
    matched_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = sms_inbox.matched_order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage sms" ON public.sms_inbox;
CREATE POLICY "Admins manage sms"
  ON public.sms_inbox FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_sms_inbox_match ON public.sms_inbox (status, amount, sender_number);
CREATE INDEX IF NOT EXISTS idx_sms_inbox_received ON public.sms_inbox (received_at DESC);

-- 4) Webhook secret in site_settings (insert if missing)
INSERT INTO public.site_settings (key, value)
SELECT 'sms_webhook_secret', encode(gen_random_bytes(24), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'sms_webhook_secret');

-- 5) Seed default payment accounts (only if table empty)
INSERT INTO public.payment_accounts (method, account_number, account_type, instructions_bn, sort_order)
SELECT * FROM (VALUES
  ('bkash','01700000000','personal','bKash অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → Transaction ID কপি করুন',1),
  ('nagad','01800000000','personal','Nagad অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',2),
  ('rocket','017000000000','personal','Rocket অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',3)
) AS v(method, account_number, account_type, instructions_bn, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.payment_accounts);

-- ---------------------------------------------------------------------
-- STEP 68/68  (20260615071511)
-- ---------------------------------------------------------------------
-- Allow customers to update their own order's payment fields while unverified
DROP POLICY IF EXISTS "Users update own pending order payment" ON public.orders;
CREATE POLICY "Users update own pending order payment"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND payment_verified_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- FINAL STEP — PROMOTE YOUR ADMIN USER
-- ---------------------------------------------------------------------
-- Sign up through the app first, then run this with your own email:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
--
-- To make a vendor account: role = 'vendor'
-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
