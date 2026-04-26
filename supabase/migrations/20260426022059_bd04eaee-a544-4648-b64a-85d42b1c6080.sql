UPDATE public.landing_pages
SET status = 'published', publish_at = now(), updated_at = now()
WHERE slug IN ('smartphone-eid-combo', 'samsung-a23-premium', 'budget-phone-offer');