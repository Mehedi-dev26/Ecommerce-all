
CREATE TABLE public.abandoned_checkouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text,
  customer_phone text,
  customer_email text,
  division text,
  district text,
  upazila text,
  shipping_address text,
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  user_id uuid,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all abandoned checkouts"
ON public.abandoned_checkouts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert abandoned checkouts"
ON public.abandoned_checkouts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update own abandoned checkout"
ON public.abandoned_checkouts FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete abandoned checkouts"
ON public.abandoned_checkouts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_abandoned_checkouts_updated_at
BEFORE UPDATE ON public.abandoned_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
