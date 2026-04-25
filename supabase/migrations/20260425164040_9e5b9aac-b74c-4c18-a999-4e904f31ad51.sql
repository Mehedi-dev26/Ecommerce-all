-- Add cost_price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

-- Inventory purchases table (records each stock purchase batch)
CREATE TABLE IF NOT EXISTS public.inventory_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  supplier_name text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory purchases"
ON public.inventory_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert inventory purchases"
ON public.inventory_purchases FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update inventory purchases"
ON public.inventory_purchases FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete inventory purchases"
ON public.inventory_purchases FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_inventory_purchases_updated_at
BEFORE UPDATE ON public.inventory_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business expenses table (general expenses: rent, marketing, transport, etc.)
CREATE TABLE IF NOT EXISTS public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view business expenses"
ON public.business_expenses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert business expenses"
ON public.business_expenses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update business expenses"
ON public.business_expenses FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete business expenses"
ON public.business_expenses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();