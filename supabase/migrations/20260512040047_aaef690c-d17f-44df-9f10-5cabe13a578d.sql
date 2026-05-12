ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS suggested_price_per_kg numeric DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS pricing_note text;

UPDATE public.categories SET suggested_price_per_kg = 250, pricing_note = 'প্রতি কেজি ২৩০-২৮০ টাকা (গুণমান অনুযায়ী)' WHERE name_bn = 'আম্রপালি আম';
UPDATE public.categories SET suggested_price_per_kg = 200, pricing_note = 'প্রতি কেজি ১৮০-২২০ টাকা' WHERE name_bn = 'ন্যাংরা আম';
UPDATE public.categories SET suggested_price_per_kg = 700, pricing_note = 'প্রতি কেজি ৬০০-১২০০ টাকা (জাত অনুযায়ী)' WHERE name_bn = 'খেজুর';
UPDATE public.categories SET suggested_price_per_kg = 800, pricing_note = 'প্রতি কেজি ৭০০-১০০০ টাকা (খাঁটি মধু)' WHERE name_bn = 'মধু';