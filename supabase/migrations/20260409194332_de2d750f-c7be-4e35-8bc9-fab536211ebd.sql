
-- Add Pathao tracking columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pathao_consignment_id text,
  ADD COLUMN IF NOT EXISTS pathao_order_status text,
  ADD COLUMN IF NOT EXISTS pathao_tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders(pathao_consignment_id) WHERE pathao_consignment_id IS NOT NULL;
