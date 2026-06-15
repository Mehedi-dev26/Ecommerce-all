
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS requires_advance_payment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percent NUMERIC NOT NULL DEFAULT 50 CHECK (advance_percent >= 0 AND advance_percent <= 100);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC NOT NULL DEFAULT 0;
