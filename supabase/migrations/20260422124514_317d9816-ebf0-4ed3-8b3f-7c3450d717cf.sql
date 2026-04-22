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
    CREATE POLICY "Anyone can upload review images"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'reviews');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read product images'
  ) THEN
    CREATE POLICY "Public can read product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;