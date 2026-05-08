
-- 1) ORDERS: drop public SELECT, add owner + admin SELECT
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.orders;

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2) ORDER_ITEMS: drop public SELECT, restrict to owner/admin
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id IS NOT NULL
        AND o.user_id = auth.uid()
    )
  );

-- 3) ABANDONED_CHECKOUTS: scope insert/update to the owning auth user
DROP POLICY IF EXISTS "Anyone can insert abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned checkouts" ON public.abandoned_checkouts;

CREATE POLICY "Users can insert own abandoned checkout"
  ON public.abandoned_checkouts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own abandoned checkout"
  ON public.abandoned_checkouts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update abandoned checkouts"
  ON public.abandoned_checkouts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (true);

-- 4) EMAIL_LOGS: remove public insert; service role bypasses RLS for the edge function
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;

-- 5) PRODUCTS: hide cost_price from public clients via column-level grants
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, name_bn, description, description_bn, category_id, price, compare_price, stock, image_url, images, weight, unit, grade, is_active, is_featured, created_at, updated_at, coming_soon)
  ON public.products TO anon, authenticated;
-- Admins (which use the same authenticated role + has_role check via RLS) need cost_price too;
-- grant cost_price to authenticated only — RLS still gates row access, and the column is only
-- read in the admin panel which runs as authenticated.
GRANT SELECT (cost_price) ON public.products TO authenticated;

-- 6) STORAGE: remove broad SELECT policy that allows listing the product-images bucket.
-- Public CDN downloads still work because the bucket is public.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- 7) Helper RPC: generate next sequential order number (replaces client-side count of all orders)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.orders;
  RETURN 'SM-' || LPAD(next_num::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO anon, authenticated;

-- 8) Helper RPC: lookup an order by order_number + customer_phone (for guest tracking)
CREATE OR REPLACE FUNCTION public.lookup_order_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  order_number text,
  total numeric,
  subtotal numeric,
  shipping_cost numeric,
  status text,
  created_at timestamptz,
  city text,
  district text,
  payment_method text,
  shipping_address text,
  pathao_consignment_id text,
  pathao_order_status text,
  pathao_tracking_url text,
  delivery_fee numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.total, o.subtotal, o.shipping_cost, o.status,
         o.created_at, o.city, o.district, o.payment_method, o.shipping_address,
         o.pathao_consignment_id, o.pathao_order_status, o.pathao_tracking_url, o.delivery_fee
  FROM public.orders o
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_order_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_number(text, text) TO anon, authenticated;

-- 9) Helper RPC: count orders for a customer email (used to detect first-time customer)
CREATE OR REPLACE FUNCTION public.count_orders_by_email(_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.orders WHERE customer_email = _email
$$;

REVOKE ALL ON FUNCTION public.count_orders_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_orders_by_email(text) TO anon, authenticated;

-- 10) Helper RPC: lookup order items by order_number + customer_phone (paired with #8)
CREATE OR REPLACE FUNCTION public.lookup_order_items_by_number(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_name text,
  quantity integer,
  price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
$$;

REVOKE ALL ON FUNCTION public.lookup_order_items_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_items_by_number(text, text) TO anon, authenticated;
