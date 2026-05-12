
DROP POLICY IF EXISTS "Admins can update abandoned checkouts" ON public.abandoned_checkouts;
CREATE POLICY "Admins can update abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
