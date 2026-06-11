
-- Threads
CREATE TABLE public.vendor_support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  subject text,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_admin integer NOT NULL DEFAULT 0,
  unread_vendor integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vst_vendor_idx ON public.vendor_support_threads(vendor_id);
CREATE INDEX vst_last_msg_idx ON public.vendor_support_threads(last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_threads TO authenticated;
GRANT ALL ON public.vendor_support_threads TO service_role;
ALTER TABLE public.vendor_support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own support threads" ON public.vendor_support_threads
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors create own support threads" ON public.vendor_support_threads
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
              OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors update own threads" ON public.vendor_support_threads
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete threads" ON public.vendor_support_threads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER vst_updated_at BEFORE UPDATE ON public.vendor_support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.vendor_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.vendor_support_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('vendor','admin','system')),
  sender_id uuid,
  sender_name text,
  body text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vsm_thread_idx ON public.vendor_support_messages(thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_support_messages TO authenticated;
GRANT ALL ON public.vendor_support_messages TO service_role;
ALTER TABLE public.vendor_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view thread messages" ON public.vendor_support_messages
  FOR SELECT TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members send messages" ON public.vendor_support_messages
  FOR INSERT TO authenticated
  WITH CHECK (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members update read state" ON public.vendor_support_messages
  FOR UPDATE TO authenticated
  USING (thread_id IN (
    SELECT id FROM public.vendor_support_threads
    WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to bump thread metadata on new message
CREATE OR REPLACE FUNCTION public.touch_vendor_support_thread()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.vendor_support_threads
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.body, 200),
      unread_admin = CASE WHEN NEW.sender_role = 'vendor' THEN unread_admin + 1 ELSE unread_admin END,
      unread_vendor = CASE WHEN NEW.sender_role = 'admin' THEN unread_vendor + 1 ELSE unread_vendor END,
      updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;

CREATE TRIGGER vsm_touch_thread AFTER INSERT ON public.vendor_support_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_vendor_support_thread();

-- Notifications
CREATE TABLE public.vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vn_vendor_idx ON public.vendor_notifications(vendor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own notifications" ON public.vendor_notifications
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors mark own notifications" ON public.vendor_notifications
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins create notifications" ON public.vendor_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete notifications" ON public.vendor_notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
