
-- 1) payment_accounts
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  account_number text NOT NULL,
  account_type text NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','merchant','agent')),
  logo_url text,
  instructions_bn text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment accounts"
  ON public.payment_accounts FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payment accounts"
  ON public.payment_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_accounts_updated
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_sender_number text,
  ADD COLUMN IF NOT EXISTS payment_txn_id text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_expected_amount numeric,
  ADD COLUMN IF NOT EXISTS advance_paid boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_payment_match
  ON public.orders (payment_provider, payment_sender_number, payment_expected_amount)
  WHERE payment_verified_at IS NULL;

-- 3) sms_inbox
CREATE TABLE IF NOT EXISTS public.sms_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message text NOT NULL,
  sender_address text,
  provider text,
  amount numeric,
  txn_id text,
  sender_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  matched_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_at timestamptz,
  status text NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','matched','duplicate','invalid')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_inbox TO authenticated;
GRANT ALL ON public.sms_inbox TO service_role;

ALTER TABLE public.sms_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all sms"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read sms for their orders"
  ON public.sms_inbox FOR SELECT
  TO authenticated
  USING (
    matched_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = sms_inbox.matched_order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage sms"
  ON public.sms_inbox FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_sms_inbox_match ON public.sms_inbox (status, amount, sender_number);
CREATE INDEX IF NOT EXISTS idx_sms_inbox_received ON public.sms_inbox (received_at DESC);

-- 4) Webhook secret in site_settings (insert if missing)
INSERT INTO public.site_settings (key, value)
SELECT 'sms_webhook_secret', encode(gen_random_bytes(24), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'sms_webhook_secret');

-- 5) Seed default payment accounts (only if table empty)
INSERT INTO public.payment_accounts (method, account_number, account_type, instructions_bn, sort_order)
SELECT * FROM (VALUES
  ('bkash','01700000000','personal','bKash অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → Transaction ID কপি করুন',1),
  ('nagad','01800000000','personal','Nagad অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',2),
  ('rocket','017000000000','personal','Rocket অ্যাপ খুলুন → Send Money → উপরের নম্বরে টাকা পাঠান → TxnID কপি করুন',3)
) AS v(method, account_number, account_type, instructions_bn, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.payment_accounts);
