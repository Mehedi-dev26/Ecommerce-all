
-- Add grade column to products (A, B, C, D — nullable so existing products unaffected)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D'));

-- Add a flag to categories so admin can mark which categories need a weight field
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS requires_weight BOOLEAN NOT NULL DEFAULT false;
