-- Add vendor_id to landing_pages so vendors can own their own pages
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS vendor_id uuid;

-- Unique slug per-vendor (admin pages have vendor_id IS NULL and remain globally unique via existing slug index)
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_vendor_slug_unique
  ON public.landing_pages (vendor_id, slug)
  WHERE vendor_id IS NOT NULL;

-- Vendor RLS policies
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