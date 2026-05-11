
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
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true AND vendor_status = 'approved');

-- Vendors manage their own products (new ones start as pending)
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

CREATE POLICY "Vendors can update own products"
  ON public.products FOR UPDATE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

CREATE POLICY "Vendors can delete own products"
  ON public.products FOR DELETE
  USING (
    vendor_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved'
    )
  );

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
CREATE TRIGGER trg_order_items_vendor_commission
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_order_item_vendor_commission();

-- Vendors can view their own order items
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

CREATE POLICY "Vendors can view own settings"
  ON public.vendor_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can insert own settings"
  ON public.vendor_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can update own settings"
  ON public.vendor_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Admins can view all vendor settings"
  ON public.vendor_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all vendor settings"
  ON public.vendor_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor settings"
  ON public.vendor_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

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

CREATE POLICY "Vendors can view own payouts"
  ON public.vendor_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can request payouts"
  ON public.vendor_payouts FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid() AND v.status = 'approved')
  );

CREATE POLICY "Admins can view all payouts"
  ON public.vendor_payouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payouts"
  ON public.vendor_payouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payouts"
  ON public.vendor_payouts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_vendor_payouts_updated_at
BEFORE UPDATE ON public.vendor_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
