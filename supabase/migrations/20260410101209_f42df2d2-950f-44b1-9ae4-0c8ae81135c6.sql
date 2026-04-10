
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default footer settings
INSERT INTO public.site_settings (key, value, label) VALUES
  ('footer_phone', '+880 1798-268989', 'ফোন নম্বর'),
  ('footer_email', 'info@sapaharmango.com', 'ইমেইল'),
  ('footer_location', 'সাপাহার, নওগাঁ, বাংলাদেশ', 'ঠিকানা'),
  ('footer_facebook', '#', 'ফেসবুক লিংক'),
  ('footer_copyright', '© {year} Sapahar Mango — সাপাহারের দেশি আম। সর্বস্বত্ব সংরক্ষিত।', 'কপিরাইট টেক্সট');
