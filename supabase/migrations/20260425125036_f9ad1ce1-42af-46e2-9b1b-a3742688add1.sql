-- Add 5 new ready-to-use email templates for admin

INSERT INTO public.email_templates (template_key, name, description, subject, html_body, is_active, is_system)
VALUES
-- 1. Shipping notification
(
  'order_shipped',
  'Order Shipped / অর্ডার পাঠানো হয়েছে',
  'Notify customer that order has been shipped via courier',
  '🚚 আপনার অর্ডার #{{order_code}} পাঠানো হয়েছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#fbbf24);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🚚 অর্ডার পাঠানো হয়েছে!</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your order is on the way</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">আপনার অর্ডার <strong style="color:#f59e0b;">#{{order_code}}</strong> কুরিয়ারে পাঠানো হয়েছে এবং খুব শীঘ্রই আপনার ঠিকানায় পৌঁছে যাবে। ইনশাআল্লাহ্‌।</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:6px;margin:20px 0;">
<p style="margin:0 0 6px;font-size:13px;color:#78350f;">ট্র্যাকিং নম্বর / Tracking ID</p>
<p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">{{tracking_id}}</p>
</div>
<p style="font-size:14px;color:#475569;line-height:1.7;">কুরিয়ার: <strong>{{courier_name}}</strong><br/>প্রত্যাশিত ডেলিভারি: <strong>{{delivery_date}}</strong></p>
<div style="text-align:center;margin:28px 0;">
<a href="{{tracking_url}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">ট্র্যাক করুন / Track Order</a>
</div>
<p style="font-size:13px;color:#94a3b8;text-align:center;margin:20px 0 0;">কোনো প্রশ্ন থাকলে যোগাযোগ করুন: {{company_email}}</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — তাজা ফলের নিশ্চয়তা
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 2. Order delivered
(
  'order_delivered',
  'Order Delivered / অর্ডার ডেলিভার হয়েছে',
  'Confirmation when order is successfully delivered',
  '✅ অর্ডার #{{order_code}} ডেলিভার সম্পন্ন — ধন্যবাদ!',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:36px;text-align:center;color:#fff;">
<div style="font-size:48px;margin-bottom:8px;">✅</div>
<h1 style="margin:0;font-size:24px;">ডেলিভারি সম্পন্ন!</h1>
<p style="margin:6px 0 0;opacity:0.95;">Order Delivered Successfully</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার অর্ডার <strong>#{{order_code}}</strong> সফলভাবে ডেলিভার হয়েছে। আমাদের সেবা পছন্দ হয়েছে কিনা জানাতে ভুলবেন না!</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:#166534;font-weight:600;">আপনার অভিজ্ঞতা শেয়ার করুন</p>
<a href="https://{{site_url}}/products" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">রিভিউ দিন / Leave a Review</a>
</div>
<p style="font-size:13px;color:#64748b;line-height:1.6;text-align:center;margin:20px 0 0;">আপনার ভরসায় আমরা কৃতজ্ঞ। আবার অর্ডার করতে ভুলবেন না!</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}} — সাপাহারের সেরা আম
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 3. Abandoned cart recovery
(
  'abandoned_cart',
  'Abandoned Cart Recovery / কার্ট রিকভারি',
  'Remind customer about items left in cart',
  '🛒 আপনার কার্টে কিছু রয়ে গেছে — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fef9f3;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;color:#fff;">
<h1 style="margin:0;font-size:26px;">🛒 কিছু ভুলে গেছেন?</h1>
<p style="margin:8px 0 0;opacity:0.95;">Your cart is waiting for you</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনি কিছু পছন্দের পণ্য কার্টে রেখে চলে গেছেন। এগুলো শেষ হওয়ার আগেই অর্ডার সম্পন্ন করুন!</p>
{{items_html}}
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px;border-radius:6px;margin:20px 0;">
<p style="margin:0;font-size:13px;color:#991b1b;">⚡ স্টক সীমিত — দ্রুত অর্ডার করুন</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/cart" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">অর্ডার সম্পন্ন করুন / Complete Order</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 4. Promo / Discount offer
(
  'promo_offer',
  'Promo Offer / বিশেষ অফার',
  'Send special discount or seasonal offer to customer',
  '🎁 বিশেষ অফার আপনার জন্য — {{site_name}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fdf4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#9333ea,#c026d3);padding:36px;text-align:center;color:#fff;">
<div style="font-size:42px;margin-bottom:8px;">🎁</div>
<h1 style="margin:0;font-size:26px;">{{offer_title}}</h1>
<p style="margin:8px 0 0;opacity:0.95;font-size:14px;">{{offer_subtitle}}</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">{{offer_body}}</p>
<div style="background:linear-gradient(135deg,#fdf4ff,#fae8ff);border:2px dashed #9333ea;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
<p style="margin:0 0 6px;font-size:13px;color:#6b21a8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">কুপন কোড</p>
<p style="margin:0;font-size:28px;font-weight:800;color:#9333ea;letter-spacing:3px;">{{coupon_code}}</p>
<p style="margin:10px 0 0;font-size:12px;color:#6b21a8;">মেয়াদ: {{expiry_date}}</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#9333ea;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">এখনই কিনুন / Shop Now</a>
</div>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
),

-- 5. Review request
(
  'review_request',
  'Review Request / রিভিউ অনুরোধ',
  'Ask customer for a product review after delivery',
  '⭐ আপনার মতামত জানাতে ভুলবেন না — অর্ডার #{{order_code}}',
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fffbeb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,#eab308,#facc15);padding:36px;text-align:center;color:#0f172a;">
<div style="font-size:42px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
<h1 style="margin:0;font-size:24px;">আপনার রিভিউ দরকার!</h1>
<p style="margin:8px 0 0;opacity:0.85;">Share your experience</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="font-size:16px;color:#0f172a;margin:0 0 16px;">প্রিয় <strong>{{customer_name}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.7;">আপনার সাম্প্রতিক অর্ডার <strong>#{{order_code}}</strong> এর অভিজ্ঞতা কেমন ছিল? একটি সংক্ষিপ্ত রিভিউ দিয়ে অন্য গ্রাহকদেরও সাহায্য করুন।</p>
<div style="background:#fef3c7;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
<p style="margin:0;font-size:14px;color:#78350f;font-weight:600;">আপনার মতামত আমাদের কাছে অমূল্য</p>
</div>
<div style="text-align:center;margin:24px 0;">
<a href="https://{{site_url}}/products" style="display:inline-block;background:#eab308;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">রিভিউ দিন / Write Review</a>
</div>
<p style="font-size:12px;color:#94a3b8;text-align:center;margin:16px 0 0;">এক মিনিটেরও কম সময় লাগবে</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
© {{site_name}}
</td></tr>
</table>
</td></tr></table></body></html>',
  true, true
)
ON CONFLICT (template_key) DO NOTHING;