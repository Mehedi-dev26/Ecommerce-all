UPDATE public.site_settings SET value = 'আশুরন্দ বাজার, সাপাহার, নওগাঁ' WHERE key = 'footer_location';
INSERT INTO public.site_settings (key, value, label)
SELECT 'footer_location', 'আশুরন্দ বাজার, সাপাহার, নওগাঁ', 'ঠিকানা'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'footer_location');