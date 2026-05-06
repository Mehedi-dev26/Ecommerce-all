
-- Courier providers table
CREATE TABLE public.courier_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view courier providers"
  ON public.courier_providers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert courier providers"
  ON public.courier_providers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courier providers"
  ON public.courier_providers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courier providers"
  ON public.courier_providers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER courier_providers_updated_at
  BEFORE UPDATE ON public.courier_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default rows (empty creds — admin fills via UI; env fallback exists for Pathao)
INSERT INTO public.courier_providers (provider_key, display_name, is_active, is_default, sort_order, credentials)
VALUES
  ('pathao', 'Pathao', true, true, 1, '{"base_url":"https://api-hermes.pathao.com"}'::jsonb),
  ('steadfast', 'Steadfast', false, false, 2, '{"base_url":"https://portal.packzy.com/api/v1"}'::jsonb);

-- Add courier tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_provider TEXT,
  ADD COLUMN IF NOT EXISTS courier_tracking_id TEXT;
