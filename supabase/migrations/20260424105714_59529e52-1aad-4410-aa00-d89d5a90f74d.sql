-- ============================================
-- Landing Pages Table
-- ============================================
CREATE TABLE public.landing_pages (
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
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view published pages within schedule
CREATE POLICY "Public can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (
  status = 'published'
  AND (publish_at IS NULL OR publish_at <= now())
  AND (expire_at IS NULL OR expire_at > now())
);

-- RLS: Admins can view all
CREATE POLICY "Admins can view all landing pages"
ON public.landing_pages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can insert
CREATE POLICY "Admins can insert landing pages"
ON public.landing_pages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can update
CREATE POLICY "Admins can update landing pages"
ON public.landing_pages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can delete
CREATE POLICY "Admins can delete landing pages"
ON public.landing_pages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Add landing_page_id to orders for attribution
-- ============================================
ALTER TABLE public.orders
ADD COLUMN landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_landing_page_id ON public.orders(landing_page_id);

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

CREATE TRIGGER landing_page_order_stats
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_landing_page_stats();