
-- 1) Column-level privilege hardening for anonymous visitors
REVOKE SELECT (cost_price) ON public.products FROM anon;
REVOKE SELECT (nid_number, email, phone, address, commission_percent, total_revenue, total_commission_earned, owner_name) ON public.vendors FROM anon;
REVOKE SELECT (contact_info) ON public.customer_reviews FROM anon;

-- 2) Storage: drop overly broad public listing policies on product-images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor logos publicly viewable" ON storage.objects;
-- Files in the public bucket remain accessible by direct URL via the storage CDN; we only remove API-level listing.

-- 3) Tighten "always true" insert policies on orders / order_items
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NULL AND o.user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND (o.user_id IS NULL OR o.user_id = auth.uid()))
      )
  )
);

-- 4) Revoke EXECUTE on internal/trigger SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_cancel() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_item_delete() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_order_item_vendor_commission() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_landing_page_stats() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
-- has_role is used inside RLS policy expressions (evaluated with table owner privileges); clients don't need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
