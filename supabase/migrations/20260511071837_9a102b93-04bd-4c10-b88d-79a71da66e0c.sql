
-- Add 'vendor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendors table
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_name text NOT NULL,
  shop_name_bn text NOT NULL,
  shop_slug text NOT NULL UNIQUE,
  logo_url text,
  banner_url text,
  description text,
  owner_name text NOT NULL,
  nid_number text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  facebook_url text,
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid,
  commission_percent numeric NOT NULL DEFAULT 10,
  total_orders integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_commission_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE UNIQUE INDEX idx_vendors_nid ON public.vendors(nid_number);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can submit vendor registration"
ON public.vendors FOR INSERT
WITH CHECK (status = 'pending' AND auth.uid() = user_id);

CREATE POLICY "Users can view own vendor record"
ON public.vendors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending vendor record"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Public can view approved vendors"
ON public.vendors FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all vendors"
ON public.vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all vendors"
ON public.vendors FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vendors"
ON public.vendors FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for vendor logos in product-images bucket
CREATE POLICY "Vendor logos publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'vendor-logos');

CREATE POLICY "Authenticated users can upload vendor logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update vendor logos they uploaded"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vendor logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'vendor-logos'
  AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'))
);
