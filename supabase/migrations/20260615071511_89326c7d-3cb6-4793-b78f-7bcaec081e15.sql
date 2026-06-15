-- Allow customers to update their own order's payment fields while unverified
CREATE POLICY "Users update own pending order payment"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND payment_verified_at IS NULL)
  WITH CHECK (user_id = auth.uid());