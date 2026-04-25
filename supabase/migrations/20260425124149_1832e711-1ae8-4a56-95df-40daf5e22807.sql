
-- Add admin notification email setting
INSERT INTO public.site_settings (key, value, label)
VALUES ('admin_notification_email', 'surzoshop@gmail.com', 'Admin Order Notification Email')
ON CONFLICT (key) DO NOTHING;

-- Add new_order_admin email template
INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES (
  'new_order_admin',
  'New Order Admin Alert / নতুন অর্ডার এডমিন এলার্ট',
  'Sent to admin when a new order is placed',
  '🔔 নতুন অর্ডার #{{order_code}} - ৳{{order_total}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:24px;color:#fff;">
<h1 style="margin:0;font-size:22px;">🔔 নতুন অর্ডার এসেছে!</h1>
<p style="margin:6px 0 0;opacity:0.9;font-size:14px;">New Order Notification — {{site_name}}</p>
</td></tr>
<tr><td style="padding:24px;">
<div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:6px;margin-bottom:20px;">
<p style="margin:0;font-size:13px;color:#475569;">অর্ডার নম্বর / Order #</p>
<p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0891b2;">{{order_code}}</p>
</div>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">গ্রাহকের তথ্য / Customer Details</h3>
<table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#334155;border-collapse:collapse;margin-bottom:20px;">
<tr><td style="border-bottom:1px solid #e2e8f0;width:140px;color:#64748b;">নাম / Name</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_name}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ফোন / Phone</td><td style="border-bottom:1px solid #e2e8f0;font-weight:600;">{{customer_phone}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;">ইমেইল / Email</td><td style="border-bottom:1px solid #e2e8f0;">{{customer_email}}</td></tr>
<tr><td style="border-bottom:1px solid #e2e8f0;color:#64748b;vertical-align:top;">ঠিকানা / Address</td><td style="border-bottom:1px solid #e2e8f0;">{{shipping_address}}</td></tr>
<tr><td style="color:#64748b;">পেমেন্ট / Payment</td><td style="font-weight:600;text-transform:uppercase;">{{payment_method}}</td></tr>
</table>
<h3 style="margin:0 0 10px;color:#0f172a;font-size:16px;">পণ্য / Items</h3>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
<tr><td style="padding:6px 0;color:#64748b;">সাবটোটাল / Subtotal</td><td align="right" style="padding:6px 0;">৳ {{order_subtotal}}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;">ডেলিভারি / Shipping</td><td align="right" style="padding:6px 0;">৳ {{order_shipping}}</td></tr>
<tr><td style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">মোট / Total</td><td align="right" style="padding:10px 0;border-top:2px solid #0891b2;font-weight:700;font-size:16px;color:#0891b2;">৳ {{order_total}}</td></tr>
</table>
<div style="text-align:center;margin-top:24px;">
<a href="https://{{site_url}}/admin/orders" style="display:inline-block;background:#0891b2;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার দেখুন / View Order</a>
</div>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:12px;">
এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে — {{site_name}} Admin System
</td></tr>
</table>
</td></tr></table></body></html>',
  true,
  true
)
ON CONFLICT (template_key) DO NOTHING;
