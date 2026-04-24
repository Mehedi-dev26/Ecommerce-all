-- Email Templates Table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view templates" ON public.email_templates
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert templates" ON public.email_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update templates" ON public.email_templates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete templates" ON public.email_templates
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role) AND is_system = false);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email Logs Table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body text,
  template_key text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  gmail_message_id text,
  related_order_id uuid,
  related_user_id uuid,
  sent_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete email logs" ON public.email_logs
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_order ON public.email_logs(related_order_id) WHERE related_order_id IS NOT NULL;

-- Seed 5 bilingual professional email templates
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_system) VALUES
('welcome_signup', 'Welcome / স্বাগতম', 'নতুন signup এর জন্য welcome email', 'স্বাগতম {{site_name}} পরিবারে! 🎉',
'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">স্বাগতম! 🎉</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:16px;">Welcome to {{site_name}}</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;color:#0f172a;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">আপনাকে আমাদের পরিবারে স্বাগতম জানাচ্ছি! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন থেকে আপনি আমাদের সকল সেবা উপভোগ করতে পারবেন।</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;">Dear {{customer_name}}, welcome to our family! Your account has been created successfully. You can now enjoy all our services.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:16px 20px;border-radius:8px;">
<p style="margin:0 0 8px;font-weight:600;color:#0f766e;">✨ আপনি পাবেন:</p>
<ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
<li>সেরা মানের পণ্য সরাসরি আপনার দোরগোড়ায়</li>
<li>দ্রুত ডেলিভারি সারা বাংলাদেশে</li>
<li>বিশেষ ছাড় ও অফার</li>
<li>২৪/৭ কাস্টমার সাপোর্ট</li>
</ul></td></tr></table>
<table cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);border-radius:8px;">
<a href="https://{{site_url}}/products" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">এখনই কেনাকাটা শুরু করুন →</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন: <a href="mailto:{{company_email}}" style="color:#0d9488;text-decoration:none;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}} — সর্বস্বত্ব সংরক্ষিত</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_confirmation', 'Order Confirmation / অর্ডার নিশ্চিতকরণ', 'অর্ডার দেয়ার সাথে সাথে পাঠানো হয়', '✅ আপনার অর্ডার পেয়েছি — {{order_code}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 30px;text-align:center;">
<div style="background:#ffffff;width:64px;height:64px;border-radius:50%;display:inline-block;line-height:64px;font-size:32px;margin-bottom:12px;">✅</div>
<h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">অর্ডার নিশ্চিত হয়েছে!</h1>
<p style="color:#d1fae5;margin:8px 0 0;font-size:15px;">Order Confirmed Successfully</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 8px;">আসসালামু আলাইকুম <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারটি আমরা সফলভাবে পেয়েছি। নিচে আপনার অর্ডারের সম্পূর্ণ বিবরণ দেওয়া হলো।</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:12px;padding:20px;margin:0 0 24px;"><tr><td>
<p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0;font-size:22px;font-weight:700;color:#0f766e;">{{order_code}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:0 0 12px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">📦 আপনার পণ্য</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:2px solid #e2e8f0;padding-top:16px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি চার্জ:</td><td align="right" style="padding:6px 0;font-weight:600;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:12px 0 6px;font-size:17px;font-weight:700;border-top:1px solid #e2e8f0;">মোট:</td><td align="right" style="padding:12px 0 6px;font-size:20px;font-weight:700;color:#0d9488;border-top:1px solid #e2e8f0;">৳ {{order_total}}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0 0 6px;font-weight:600;color:#92400e;">🚚 ডেলিভারি ঠিকানা</p>
<p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">{{shipping_address}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে। ধন্যবাদ আমাদের উপর আস্থা রাখার জন্য! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 প্রশ্ন থাকলে: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('first_order_thanks', 'First Order Thanks / প্রথম অর্ডার ধন্যবাদ', 'প্রথমবার অর্ডারকারী customer-কে বিশেষ ধন্যবাদ', '🎁 ধন্যবাদ আপনার প্রথম অর্ডারের জন্য, {{customer_name}}!',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:50px 30px;text-align:center;">
<div style="font-size:56px;margin-bottom:8px;">🎁</div>
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">অসংখ্য ধন্যবাদ!</h1>
<p style="color:#fef3c7;margin:8px 0 0;font-size:16px;">Thank You for Your First Order</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:18px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.8;color:#475569;margin:0 0 16px;">আপনার <strong>প্রথম অর্ডারটি</strong> আমাদের জন্য অনেক বিশেষ! আপনি আমাদের উপর বিশ্বাস রেখেছেন বলে আমরা কৃতজ্ঞ। 💚</p>
<p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 24px;font-style:italic;">Your first order means a lot to us. Thank you for trusting {{site_name}}!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7,#fed7aa);border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 8px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:600;">আপনার অর্ডার</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#9a3412;">{{order_code}}</p>
<p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#7c2d12;">৳ {{order_total}}</p>
</td></tr></table>
<h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">🎉 আপনার জন্য বিশেষ সুবিধা:</h3>
<ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
<li>পরের অর্ডারে <strong>বিশেষ ছাড়</strong> পেতে আমাদের সাথে থাকুন</li>
<li>নতুন পণ্যের আপডেট সবার আগে জানুন</li>
<li>VIP কাস্টমার হিসেবে অগ্রাধিকার সেবা</li>
</ul>
<p style="font-size:14px;line-height:1.7;color:#475569;margin:16px 0 0;">আপনার ফিডব্যাক আমাদের কাছে অমূল্য। অর্ডার পেয়ে আপনার অভিজ্ঞতা আমাদের জানাতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">💚 আপনার বিশ্বাসের জন্য আবারও ধন্যবাদ</p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('order_status_update', 'Order Status Update / অর্ডার স্ট্যাটাস', 'Admin status পরিবর্তন করলে পাঠানো হয়', '📦 আপনার অর্ডার {{order_code}} এখন: {{order_status}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:40px 30px;text-align:center;">
<div style="font-size:48px;margin-bottom:8px;">📦</div>
<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">অর্ডার স্ট্যাটাস আপডেট</h1>
<p style="color:#cffafe;margin:8px 0 0;font-size:14px;">Order Status Update</p>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">আপনার অর্ডারের স্ট্যাটাস পরিবর্তন হয়েছে। বিস্তারিত নিচে দেওয়া হলো:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:2px solid #14b8a6;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;"><tr><td>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">অর্ডার নম্বর</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#134e4a;">{{order_code}}</p>
<p style="margin:0 0 6px;font-size:13px;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px;">বর্তমান স্ট্যাটাস</p>
<p style="margin:0;font-size:24px;font-weight:700;color:#0d9488;text-transform:capitalize;">{{order_status}}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-left:4px solid #facc15;border-radius:8px;padding:16px 20px;margin:0 0 16px;"><tr><td>
<p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">💬 <strong>বার্তা:</strong> {{status_message}}</p>
</td></tr></table>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না। আপনার পাশে আছি! 💚</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 যোগাযোগ: <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true),

('custom_admin', 'Custom Admin Email / কাস্টম ইমেইল', 'Admin থেকে customer-কে কাস্টম মেসেজ', '{{custom_subject}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:32px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">{{site_name}}</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:17px;margin:0 0 20px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<div style="font-size:15px;line-height:1.8;color:#334155;">{{custom_message}}</div>
<p style="font-size:14px;color:#64748b;margin:32px 0 0;">শুভকামনায়,<br/><strong>{{site_name}} টিম</strong></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;color:#64748b;">📞 <a href="mailto:{{company_email}}" style="color:#0d9488;">{{company_email}}</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© {{site_name}}</p>
</td></tr></table></td></tr></table></body></html>', true);

-- Default site_settings for email branding
INSERT INTO public.site_settings (key, value, label) VALUES
  ('company_name', 'Sapahar Mango', 'কোম্পানির নাম'),
  ('company_email', 'info@sapaharmango.com', 'কোম্পানির ইমেইল')
ON CONFLICT (key) DO NOTHING;