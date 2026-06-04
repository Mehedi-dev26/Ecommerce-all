
-- 1. Add serial_number column (per-vendor sequence) to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serial_number integer;

-- 2. Backfill: per-vendor serial ordered by created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at, id) AS rn
  FROM public.products
)
UPDATE public.products p SET serial_number = r.rn
FROM ranked r WHERE r.id = p.id AND p.serial_number IS NULL;

-- 3. Trigger to auto-assign serial on insert (per-vendor; null vendor gets global)
CREATE OR REPLACE FUNCTION public.assign_product_serial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next integer;
BEGIN
  IF NEW.serial_number IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.vendor_id IS NULL THEN
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id IS NULL;
  ELSE
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_next FROM public.products WHERE vendor_id = NEW.vendor_id;
  END IF;
  NEW.serial_number := v_next;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_product_serial ON public.products;
CREATE TRIGGER trg_assign_product_serial
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.assign_product_serial();

-- 4. Unique index per vendor
CREATE UNIQUE INDEX IF NOT EXISTS products_vendor_serial_unique
  ON public.products (vendor_id, serial_number)
  WHERE vendor_id IS NOT NULL;

-- 5. Lookup RPC: vendor slug + serial -> product row
CREATE OR REPLACE FUNCTION public.lookup_product_by_vendor_serial(_vendor_slug text, _serial integer)
RETURNS SETOF public.products
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id
  WHERE v.shop_slug = lower(trim(_vendor_slug))
    AND p.serial_number = _serial
    AND p.is_active = true
    AND p.vendor_status = 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_product_by_vendor_serial(text, integer) TO anon, authenticated;
