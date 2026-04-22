-- Add approval workflow columns to customer_reviews
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS submitted_by_customer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Mark all existing reviews as approved so they keep showing
UPDATE public.customer_reviews SET status = 'approved' WHERE status = 'pending';

-- Drop old public SELECT policy and recreate with status filter
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.customer_reviews;

CREATE POLICY "Anyone can view approved active reviews"
  ON public.customer_reviews
  FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Allow anyone (guest or authenticated) to submit a new review
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