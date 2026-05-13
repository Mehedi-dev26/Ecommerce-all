-- 1. Add WhatsApp number column to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Create the main "Sapahar Shop" vendor (official store) if not exists
INSERT INTO public.vendors (
  user_id, shop_name, shop_name_bn, shop_slug, owner_name, email, phone, whatsapp_number,
  nid_number, division, district, upazila, address, status, commission_percent,
  description, approved_at, approved_by
)
SELECT
  'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid,
  'Sapahar Shop', 'সাপাহার শপ', 'sapahar-shop',
  'Sapahar Shop Official',
  'support@sapaharshop.com', '+8801720565997', '+8801720565997',
  'OFFICIAL', 'রাজশাহী', 'নওগাঁ', 'সাপাহার',
  'সাপাহার, নওগাঁ, রাজশাহী',
  'approved', 0,
  'Sapahar Shop — সাপাহারের সেরা ও খাঁটি আম, লিচু, মধু ও খেজুর সরাসরি বাগান থেকে। ১০০% অরিজিনাল ও রাসায়নিকমুক্ত।',
  now(), 'fd0673e2-7879-4f63-b6ca-d58d397caea3'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.vendors WHERE shop_slug = 'sapahar-shop');

-- 3. Backfill: assign all NULL vendor_id products to main vendor
UPDATE public.products
SET vendor_id = (SELECT id FROM public.vendors WHERE shop_slug = 'sapahar-shop' LIMIT 1),
    updated_at = now()
WHERE vendor_id IS NULL;

-- 4. Add main shop fallback WhatsApp in site_settings
INSERT INTO public.site_settings (key, value, label)
VALUES ('company_whatsapp', '+8801720565997', 'Main Shop WhatsApp Number')
ON CONFLICT (key) DO NOTHING;