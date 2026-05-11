## লক্ষ্য

তিনটি কাজ একসাথে:

1. **Vercel hosted site** এ যে এলোমেলো সমস্যা হচ্ছে সেটি investigate ও fix করা
2. **Brand rename**: সব জায়গা থেকে "Mango" বাদ দিয়ে **Sapahar Shop** করা
3. **Multi-vendor marketplace** (Daraz/Bagdoom style) — full step-by-step roadmap

---

## ১. Vercel Hosting Issue Fix

আপনার Vercel এ deploy করা site এ hero/banner section ফাঁকা দেখাচ্ছে এবং layout ভেঙে যাচ্ছে। সম্ভাব্য কারণ:

- `vercel.json` এ asset caching headers এ banner image URLs cached হয়ে আছে কিন্তু Supabase signed URL expire হয়ে যাচ্ছে
- Banner table থেকে `image_url` load হচ্ছে না (Supabase RLS / public URL issue)
- Vercel build এ environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) missing
- Cache headers এ `(.*)\.(js|css|...)` pattern aggressive — index.html বাদে সব immutable cache, fresh deploy হলেও user পুরনো version দেখছে

**Fix plan**:
- Vercel project এ env variables verify করা (instructions দিবো)
- `vercel.json` headers softer করা (no-cache for HTML, controlled cache for chunks)
- Hero/Banner component এ fallback + error boundary
- Service worker / browser cache clear করার জন্য build hash invalidation

---

## ২. Brand Rename: "Sapahar Mango Shop" → "Sapahar Shop"

সব জায়গায় "Mango" শব্দ বাদ দেওয়া হবে — কারণ এখন এটা multi-vendor marketplace হবে, শুধু আম নয়।

**পরিবর্তন হবে যেসব জায়গায়**:

- `index.html` — `<title>`, meta description, OG tags
- `src/components/SEO.tsx` — default site name
- `src/components/Navbar.tsx` — logo text "Sapahar Mango Shop" → "Sapahar Shop"
- `src/components/Footer.tsx` — copyright + about text
- `src/lib/seo-schemas.ts` — organizationSchema, websiteSchema, localBusinessSchema name fields
- `src/pages/Index.tsx` — hero SEO title/desc থেকে "Mango Shop" বাদ
- `src/pages/About.tsx`, `Contact.tsx`, `PrivacyPolicy.tsx`, `TermsConditions.tsx` — brand mentions
- `src/contexts/SiteSettingsContext.tsx` defaults
- Database `site_settings` table এ যেসব key এ "Mango Shop" আছে সেগুলো update
- Email templates এ brand name update
- `public/sitemap.xml`, robots.txt verify
- Memory file `mem://brand/identity` update

**যা পরিবর্তন হবে না**:
- Supabase project ref ও Vercel domain (`sapaharmangostor.lovable.app`) — technical URL, পরে custom domain `sapaharshop.com` connect করতে পারবেন
- Existing product names (আম্রপালি আম ইত্যাদি) — এগুলো product, brand না

---

## ৩. Multi-Vendor Marketplace — Full Roadmap

### বর্তমান অবস্থা
- ✅ Phase 1 done: vendor registration form + admin approval panel + `vendors` table + `vendor` role
- ⏳ Phase 2-6: এখনো বাকি

### Phase 2 — Vendor-Product Linking (Database Foundation)

প্রতিটি product কোন vendor এর সেটা track করার জন্য:

```text
products টেবিলে যোগ:
├─ vendor_id (uuid, vendors.id ref, nullable — null = platform/admin product)
└─ vendor_status: 'pending' | 'approved' | 'rejected' (admin moderation এর জন্য)

order_items টেবিলে যোগ:
├─ vendor_id (snapshot)
├─ commission_percent (snapshot at order time)
├─ commission_amount (auto-calculated)
└─ vendor_payout_amount (price - commission)

vendor_settings টেবিল (নতুন):
├─ vendor_id, bank_name, account_number, account_holder, bkash_number
└─ withdrawal preferences

vendor_payouts টেবিল (নতুন):
├─ vendor_id, amount, status, requested_at, processed_at
├─ method (bank/bkash/nagad), transaction_ref
└─ admin_notes
```

RLS update — vendor শুধু নিজের data দেখবে, admin সব দেখবে।

### Phase 3 — Vendor Dashboard (`/vendor/*`)

আলাদা vendor layout (admin layout এর মতো কিন্তু restricted), যেখানে থাকবে:

- **`/vendor/dashboard`** — Today's orders, pending orders, total revenue, pending payout, commission deducted
- **`/vendor/products`** — নিজের product CRUD (existing AdminProducts component থেকে inspired, but filtered by vendor_id)
  - Add new product → status='pending', admin approve করার পর live হবে
  - Edit/delete নিজের product
  - Stock management
- **`/vendor/orders`** — শুধু তার shop এর order, status update, courier dispatch
- **`/vendor/earnings`** — order-wise income breakdown, commission cut, payable amount, withdrawal history
- **`/vendor/withdrawals`** — Request payout, view history
- **`/vendor/shop-settings`** — logo, banner, description, contact, payment info edit

### Phase 4 — Public Storefront for Each Vendor

- **`/shop/:slug`** — প্রতিটি vendor এর নিজস্ব public shop page
  - Banner + logo + shop name + description
  - About section, contact info
  - Vendor's all products in grid
  - Customer reviews of this shop
  - "Follow shop" feature (optional later)
- **Product card update** — প্রতিটি product card এ "by [Shop Name]" link দেখাবে → click করলে shop page এ যাবে
- **Product detail page update** — vendor info section, "Visit Shop" button
- **Homepage update** — "আমাদের বিক্রেতাগণ" section (top vendors carousel)
- **`/vendors`** — সব approved vendor browse করার page

### Phase 5 — Order Splitting & Multi-Vendor Cart

Customer যদি ৩ vendor এর product একসাথে কিনে — system কীভাবে handle করবে:

- Cart এ vendor-wise grouping দেখানো
- Checkout এ একটাই order create হবে, কিন্তু `order_items` এ প্রতিটি item এর `vendor_id` থাকবে
- প্রতিটি vendor শুধু তার নিজের item গুলো দেখবে নিজের dashboard এ
- Shipping cost calculation: vendor-wise vs combined (admin choice)
- প্রতিটি vendor আলাদা ভাবে তার item dispatch করতে পারবে

### Phase 6 — Commission, Payout & Finance

- Admin প্রতিটি vendor এর জন্য commission % set করতে পারবে (default 10%)
- প্রতিটি delivered order item এ auto-calculate commission
- Vendor wallet balance = total earned - already withdrawn
- Vendor withdrawal request → admin approve → mark paid + transaction reference
- Admin financial dashboard: total platform revenue, total commission earned, pending payouts
- Email/SMS notification on each milestone (order received, dispatched, delivered, payout processed)

### Phase 7 — Trust, Quality & Disputes

- Per-vendor rating ও review (existing review system extend করে)
- Admin product moderation (approve before listing)
- Vendor suspension flow (already partial)
- Customer complaint/dispute system
- Refund handling per vendor

---

## কোন order এ কাজ হবে (recommendation)

**আজকের কাজ (এই plan approve করলে immediate):**
1. ✅ Brand rename — সব জায়গায় "Sapahar Shop"
2. ✅ Vercel issue fix — vercel.json + env check + hero fallback

**পরবর্তী session গুলো (একটার পর একটা approve করে আগাবেন):**
3. Phase 2 — DB migration (products এ vendor_id, order_items এ commission fields, payout tables)
4. Phase 3 — Vendor dashboard (products + orders + earnings)
5. Phase 4 — Public shop pages + product card vendor link
6. Phase 5 — Multi-vendor cart/checkout split
7. Phase 6 — Payout system + financial dashboard
8. Phase 7 — Reviews + moderation + disputes

প্রতিটি phase আলাদা ভাবে test করা যাবে, system break হবে না।

---

## এই message এ approve করলে আমি কী করবো

শুধু **Phase 0 (immediate fixes)**:

1. সব file এ "Sapahar Mango Shop" / "Sapahar Mango" → "Sapahar Shop" rename
2. `site_settings` table এ brand related row update (data migration)
3. Memory file `mem://brand/identity` update
4. `vercel.json` cache headers fix
5. Hero/Banner component এ proper fallback যোগ
6. Multi-vendor roadmap এর Phase 2 DB migration **আলাদা** approval এ যাবে

এর পরের phase গুলো আপনি যখন বলবেন তখন একে একে শুরু করবো।

**Approve করুন তাহলে rename + Vercel fix দিয়ে শুরু করি?**
