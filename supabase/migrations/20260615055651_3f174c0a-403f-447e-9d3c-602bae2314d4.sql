
CREATE TABLE public.promo_strips (
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

CREATE POLICY "Anyone can view active promo strips"
  ON public.promo_strips FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert promo strips"
  ON public.promo_strips FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo strips"
  ON public.promo_strips FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promo strips"
  ON public.promo_strips FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promo_strips_updated_at
  BEFORE UPDATE ON public.promo_strips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Demo banner (1600x200 thin promo strip)
INSERT INTO public.promo_strips (image_url, link_url, alt_text, position, sort_order, is_active)
VALUES
  ('https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=1600&q=80&auto=format&fit=crop', '/products', 'বিশেষ অফার — সাপাহারের সেরা আম', 'top', 0, true),
  ('https://images.unsplash.com/photo-1553279768-865429fa0078?w=1600&q=80&auto=format&fit=crop', '/products', 'ফ্রি ডেলিভারি অফার', 'bottom', 0, true);
