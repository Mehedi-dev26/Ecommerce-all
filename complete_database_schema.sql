-- =====================================================================
-- SAPAHAR MANGO — COMPLETE DATABASE SCHEMA
-- =====================================================================
-- Single, idempotent SQL file representing the entire current database.
-- Run it in any fresh Supabase project's SQL Editor to recreate ALL
-- tables, types, functions, triggers, RLS policies and storage buckets.
--
-- HOW TO USE (when remixing this project to a new Supabase backend):
--   1. Open new Supabase project → SQL Editor → New query
--   2. Paste this entire file → Click "Run"
--   3. Update your project's .env with the new SUPABASE_URL & ANON_KEY
--   4. Re-add edge function secrets (Pathao, Lovable AI, Gmail, etc.)
--   5. Sign up your admin user, then promote them (see bottom of file)
--
-- Safe to run multiple times — uses IF NOT EXISTS / OR REPLACE / DROP IF.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. ENUMS
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- ---------------------------------------------------------------------
-- 4. TABLES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  phone text,
  avatar_url text,
  default_address text,
  default_division text,
  default_district text,
  default_upazila text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  requires_weight boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  description text,
  description_bn text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric NOT NULL,
  compare_price numeric,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  images text[] DEFAULT '{}'::text[],
  weight text,
  unit text DEFAULT 'piece',
  grade text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text DEFAULT 'অর্ডার করুন',
  cta_link text DEFAULT '/products',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  show_text_overlay boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courier_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL,
  district text NOT NULL,
  upazila text,
  label text,
  charge_per_kg numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'বাসা',
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  meta_description text,
  theme_preset text NOT NULL DEFAULT 'mango_yellow',
  hero_headline text NOT NULL,
  hero_subheadline text,
  hero_image_url text,
  hero_video_url text,
  cta_text text NOT NULL DEFAULT 'এখনই অর্ডার করুন',
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  enable_bundle boolean NOT NULL DEFAULT false,
  bundle_discount_percent numeric DEFAULT 0,
  bundle_label text,
  bullet_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  long_description text,
  faq_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  trust_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_review_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  countdown_enabled boolean NOT NULL DEFAULT false,
  countdown_end_at timestamptz,
  stock_counter_enabled boolean NOT NULL DEFAULT false,
  stock_counter_value integer,
  facebook_pixel_id text,
  view_count integer NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  publish_at timestamptz,
  expire_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  shipping_address text NOT NULL,
  city text NOT NULL,
  district text,
  subtotal numeric NOT NULL,
  shipping_cost numeric NOT NULL DEFAULT 0,
  delivery_fee numeric DEFAULT 0,
  total numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  pathao_consignment_id text,
  pathao_order_status text,
  pathao_tracking_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_address text,
  division text,
  district text,
  upazila text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_image text,
  rating integer NOT NULL DEFAULT 5,
  review_text text NOT NULL,
  review_images text[] NOT NULL DEFAULT '{}'::text[],
  location text,
  contact_info text,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  submitted_by_customer boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- ---------------------------------------------------------------------
-- 5. BUSINESS LOGIC FUNCTIONS
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stock integer;
  product_name_val text;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;

  SELECT stock, name_bn INTO current_stock, product_name_val
  FROM public.products WHERE id = NEW.product_id FOR UPDATE;

  IF NOT FOUND THEN RETURN NEW; END IF;

  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'দুঃখিত! "%" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান স্টক: %, অর্ডার পরিমাণ: %',
      product_name_val, current_stock, NEW.quantity USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.products SET stock = stock - NEW.quantity, updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock + oi.quantity, updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock - oi.quantity, updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_stock_on_item_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_status text;
BEGIN
  IF OLD.product_id IS NULL THEN RETURN OLD; END IF;

  SELECT status INTO parent_status FROM public.orders WHERE id = OLD.order_id;

  IF parent_status IS NULL OR parent_status <> 'cancelled' THEN
    UPDATE public.products SET stock = stock + OLD.quantity, updated_at = now()
    WHERE id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_landing_page_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = order_count + 1,
        total_revenue = total_revenue + COALESCE(NEW.total, 0)
    WHERE id = NEW.landing_page_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND NEW.landing_page_id IS NOT NULL THEN
    UPDATE public.landing_pages
    SET order_count = GREATEST(order_count - 1, 0),
        total_revenue = GREATEST(total_revenue - COALESCE(NEW.total, 0), 0)
    WHERE id = NEW.landing_page_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_landing_page_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- ---------------------------------------------------------------------
-- 6. TRIGGERS
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','products','banners','courier_charges','saved_addresses',
    'landing_pages','orders','abandoned_checkouts','customer_reviews',
    'site_settings','email_templates'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

DROP TRIGGER IF EXISTS trg_restore_stock_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

DROP TRIGGER IF EXISTS trg_restore_stock_item_delete ON public.order_items;
CREATE TRIGGER trg_restore_stock_item_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_item_delete();

DROP TRIGGER IF EXISTS trg_landing_page_stats ON public.orders;
CREATE TRIGGER trg_landing_page_stats
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_landing_page_stats();

-- ---------------------------------------------------------------------
-- 7. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_charges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs          ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 8. RLS POLICIES
-- ---------------------------------------------------------------------

-- USER ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- CATEGORIES
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- BANNERS
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- COURIER CHARGES
DROP POLICY IF EXISTS "Anyone can view courier charges" ON public.courier_charges;
CREATE POLICY "Anyone can view courier charges" ON public.courier_charges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert courier charges" ON public.courier_charges;
CREATE POLICY "Admins can insert courier charges" ON public.courier_charges FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update courier charges" ON public.courier_charges;
CREATE POLICY "Admins can update courier charges" ON public.courier_charges FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete courier charges" ON public.courier_charges;
CREATE POLICY "Admins can delete courier charges" ON public.courier_charges FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- SAVED ADDRESSES
DROP POLICY IF EXISTS "Users can view own addresses" ON public.saved_addresses;
CREATE POLICY "Users can view own addresses" ON public.saved_addresses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.saved_addresses;
CREATE POLICY "Admins can view all addresses" ON public.saved_addresses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.saved_addresses;
CREATE POLICY "Users can insert own addresses" ON public.saved_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own addresses" ON public.saved_addresses;
CREATE POLICY "Users can update own addresses" ON public.saved_addresses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.saved_addresses;
CREATE POLICY "Users can delete own addresses" ON public.saved_addresses FOR DELETE USING (auth.uid() = user_id);

-- LANDING PAGES
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.landing_pages;
CREATE POLICY "Public can view published landing pages" ON public.landing_pages FOR SELECT
  USING (status = 'published' AND (publish_at IS NULL OR publish_at <= now()) AND (expire_at IS NULL OR expire_at > now()));
DROP POLICY IF EXISTS "Admins can view all landing pages" ON public.landing_pages;
CREATE POLICY "Admins can view all landing pages" ON public.landing_pages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert landing pages" ON public.landing_pages;
CREATE POLICY "Admins can insert landing pages" ON public.landing_pages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update landing pages" ON public.landing_pages;
CREATE POLICY "Admins can update landing pages" ON public.landing_pages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete landing pages" ON public.landing_pages;
CREATE POLICY "Admins can delete landing pages" ON public.landing_pages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ORDERS
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.orders;
CREATE POLICY "Anyone can view orders by phone" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ORDER ITEMS
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- ABANDONED CHECKOUTS
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Anyone can update abandoned checkouts" ON public.abandoned_checkouts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can view all abandoned checkouts" ON public.abandoned_checkouts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can delete abandoned checkouts" ON public.abandoned_checkouts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- CUSTOMER REVIEWS
DROP POLICY IF EXISTS "Anyone can view approved active reviews" ON public.customer_reviews;
CREATE POLICY "Anyone can view approved active reviews" ON public.customer_reviews FOR SELECT
  USING (is_active = true AND status = 'approved');
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.customer_reviews;
CREATE POLICY "Admins can view all reviews" ON public.customer_reviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.customer_reviews;
CREATE POLICY "Anyone can submit reviews" ON public.customer_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND submitted_by_customer = true AND is_active = false);
DROP POLICY IF EXISTS "Admins can insert reviews" ON public.customer_reviews;
CREATE POLICY "Admins can insert reviews" ON public.customer_reviews FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update reviews" ON public.customer_reviews;
CREATE POLICY "Admins can update reviews" ON public.customer_reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.customer_reviews;
CREATE POLICY "Admins can delete reviews" ON public.customer_reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- SITE SETTINGS
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;
CREATE POLICY "Admins can delete site settings" ON public.site_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- EMAIL TEMPLATES
DROP POLICY IF EXISTS "Admins can view templates" ON public.email_templates;
CREATE POLICY "Admins can view templates" ON public.email_templates FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert templates" ON public.email_templates;
CREATE POLICY "Admins can insert templates" ON public.email_templates FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update templates" ON public.email_templates;
CREATE POLICY "Admins can update templates" ON public.email_templates FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete templates" ON public.email_templates;
CREATE POLICY "Admins can delete templates" ON public.email_templates FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') AND is_system = false);

-- EMAIL LOGS
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;
CREATE POLICY "Anyone can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete email logs" ON public.email_logs;
CREATE POLICY "Admins can delete email logs" ON public.email_logs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 9. STORAGE BUCKETS
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 10. SEED DEFAULT SITE SETTINGS
-- ---------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, label) VALUES
  ('company_name',  'Sapahar Mango',     'কোম্পানির নাম'),
  ('company_email', 'info@example.com',  'কোম্পানির ইমেইল'),
  ('company_phone', '+8801XXXXXXXXX',    'কোম্পানির ফোন')
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- DONE! POST-INSTALL STEPS:
-- =====================================================================
-- 1. Sign up your admin user via the app's normal signup flow
-- 2. Get that user's UUID from Authentication → Users
-- 3. Run in SQL Editor:
--      INSERT INTO public.user_roles (user_id, role)
--      VALUES ('YOUR-USER-UUID-HERE', 'admin');
-- 4. Configure edge function secrets via Supabase Dashboard:
--      - PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_CLIENT_EMAIL,
--        PATHAO_CLIENT_PASSWORD
--      - LOVABLE_API_KEY (for AI features)
--      - GOOGLE_MAIL_API_KEY (via Lovable Connector)
-- 5. Update your project's .env with the new SUPABASE_URL and ANON_KEY
-- =====================================================================
