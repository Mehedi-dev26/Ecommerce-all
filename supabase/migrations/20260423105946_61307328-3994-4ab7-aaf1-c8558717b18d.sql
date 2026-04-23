
-- ============================================
-- AUTO STOCK MANAGEMENT SYSTEM
-- ============================================

-- 1. Function: Decrement stock when order item is inserted
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
  product_name_val text;
BEGIN
  -- Skip if no product_id (manual/custom items)
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock the product row to prevent race conditions
  SELECT stock, name_bn INTO current_stock, product_name_val
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- If product not found, allow (it might be deleted)
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Check if enough stock available
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'দুঃখিত! "%" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান স্টক: %, অর্ডার পরিমাণ: %',
      product_name_val, current_stock, NEW.quantity
      USING ERRCODE = 'P0001';
  END IF;

  -- Decrement stock atomically
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

-- 2. Function: Restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes TO 'cancelled' (not from cancelled)
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- Re-deduct if order is uncancelled (status moves away from 'cancelled')
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.products p
    SET stock = stock - oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Function: Restore stock if order_items are deleted (e.g., order deleted)
CREATE OR REPLACE FUNCTION public.restore_stock_on_item_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_status text;
BEGIN
  IF OLD.product_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Only restore if the parent order wasn't already cancelled (which already restored)
  SELECT status INTO parent_status FROM public.orders WHERE id = OLD.order_id;

  IF parent_status IS NULL OR parent_status <> 'cancelled' THEN
    UPDATE public.products
    SET stock = stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
  END IF;

  RETURN OLD;
END;
$$;

-- 4. Triggers
DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_stock_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

DROP TRIGGER IF EXISTS trg_restore_stock_on_order_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

DROP TRIGGER IF EXISTS trg_restore_stock_on_item_delete ON public.order_items;
CREATE TRIGGER trg_restore_stock_on_item_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_item_delete();
