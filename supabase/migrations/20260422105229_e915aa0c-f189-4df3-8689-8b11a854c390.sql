
-- Saved addresses for logged-in customers (Daraz-style address book)
CREATE TABLE public.saved_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'বাসা',
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
ON public.saved_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON public.saved_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON public.saved_addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON public.saved_addresses FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
ON public.saved_addresses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);

CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON public.saved_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
