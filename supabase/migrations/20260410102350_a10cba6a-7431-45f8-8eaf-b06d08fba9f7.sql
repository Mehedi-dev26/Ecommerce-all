
CREATE TABLE public.courier_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  district text NOT NULL,
  upazila text,
  charge_per_kg numeric NOT NULL DEFAULT 0,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(division, district, upazila)
);

ALTER TABLE public.courier_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courier charges"
ON public.courier_charges FOR SELECT
USING (true);

CREATE POLICY "Admins can insert courier charges"
ON public.courier_charges FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courier charges"
ON public.courier_charges FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courier charges"
ON public.courier_charges FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_courier_charges_updated_at
BEFORE UPDATE ON public.courier_charges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
