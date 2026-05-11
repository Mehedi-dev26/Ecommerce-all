## লক্ষ্য (Goal)

Sapahar Mango Shop কে একটি **multi-vendor marketplace** এ রূপান্তর করা — যেখানে যেকোনো আম/ফল বিক্রেতা registration করে নিজের shop চালু করতে পারবে, admin approve করার পর তারা product upload করবে, order পাবে, এবং প্রতিটি order থেকে platform (আপনি) একটি commission % কাটবেন।

---

## Phase 1 — Vendor Registration & Admin Approval (এই ধাপে এটাই বানাবো)

### ১. Public Vendor Registration Page (`/vendor/register`)

নতুন একটি registration form যেখানে vendor দিবে:
- Shop Name (দোকানের নাম) — Bengali + English
- Shop Logo (image upload — `product-images` bucket এ `vendor-logos/` folder)
- Owner Full Name
- NID Number (১০-১৭ digit validation)
- Mobile Number (BD format validation)
- Email
- Password (অথবা existing login user হলে auto-link)
- Location: Division → District → Upazila + full address (existing `bd-locations.ts` reuse)
- Optional: Shop Description, Facebook page link

Form submit হলে → `vendors` table এ record তৈরি হবে status='pending', user যদি logged-in না থাকে তাহলে আগে account create হবে (existing auth flow), তারপর vendor record তৈরি হবে।

Submit এর পর: "আপনার আবেদন গৃহীত হয়েছে — admin approval এর জন্য অপেক্ষা করুন" message + email notification।

### ২. Admin Panel — "দোকান নিবন্ধন" Section (`/admin/vendors`)

Sidebar এ নতুন menu item "দোকান নিবন্ধন (Shop Registration)" যোগ হবে। সেখানে থাকবে:
- **Pending Applications** tab — review করার জন্য সব pending vendors এর list
  - প্রতিটি card এ: shop logo, shop name, owner name, NID, phone, location, submitted date
  - Action buttons: **Approve**, **Reject** (reason সহ), **View Details**
- **Approved Vendors** tab — সক্রিয় সব vendor list, search/filter
  - প্রতিটি vendor এর জন্য: commission % set/edit, suspend, view shop, view orders
- **Rejected** tab — rejection history

Approve করলে: vendor কে `vendor` role assigned হবে → তার নিজের dashboard access পাবে → email notification যাবে।

### ৩. Database Schema (নতুন tables)

```text
vendors
├─ id, user_id (auth.users ref via profile)
├─ shop_name, shop_name_bn, shop_slug (unique, URL-friendly)
├─ logo_url, banner_url, description
├─ owner_name, nid_number, phone, email
├─ division, district, upazila, address
├─ status: pending | approved | rejected | suspended
├─ rejection_reason, approved_at, approved_by
├─ commission_percent (default 10%, admin editable)
├─ total_orders, total_revenue, total_commission_earned
└─ created_at, updated_at

app_role enum এ যোগ হবে: 'vendor'
```

RLS:
- যে কেউ register (insert) করতে পারবে status='pending' হিসেবে
- নিজের vendor record দেখতে পারবে
- Admin সবকিছু দেখতে/edit করতে পারবে
- Public শুধু approved vendors দেখতে পারবে (shop page এর জন্য)

---

## Phase 2 — Vendor Dashboard (পরবর্তী ধাপ — preview)

Approved vendor login করলে `/vendor/dashboard` এ redirect হবে। আলাদা vendor layout, যেখানে থাকবে:
- **Overview**: আজকের order, total revenue, pending orders, commission deducted
- **My Products**: নিজের product add/edit/delete (existing category use করবে)
- **Orders**: শুধু তার shop এর order, status update, Pathao এ পাঠানো
- **Earnings**: order-wise income breakdown, commission cut, payable amount
- **Shop Settings**: logo, banner, description, contact info edit
- **Withdrawal Requests**: টাকা তোলার request

প্রতিটি product/order এ `vendor_id` foreign key থাকবে। Order create হওয়ার সময় cart items থেকে vendor অনুযায়ী split হবে এবং প্রতিটি order_item এ vendor এর commission auto-calculate হবে।

---

## Phase 3 — Public Shop Pages (পরবর্তী ধাপ — preview)

- `/shop/:slug` — প্রতিটি vendor এর নিজস্ব public shop page (logo, banner, products, reviews)
- Homepage এ "আমাদের বিক্রেতাগণ" section
- Product card এ "by [Shop Name]" link

---

## Phase 4 — Commission & Payout (পরবর্তী ধাপ — preview)

- Admin প্রতিটি vendor এর জন্য আলাদা commission % set করতে পারবে
- প্রতিটি delivered order থেকে auto-calculate
- Vendor wallet system, withdrawal request, payment history
- Admin payout management

---

## এখন কী implement হবে (Phase 1 only)

1. Migration: `vendors` table + `vendor` role + RLS policies + storage policy for `vendor-logos/`
2. Public page: `/vendor/register` — full form with validation (zod)
3. Admin page: `/admin/vendors` — pending/approved/rejected tabs + approve/reject actions + commission setup
4. Sidebar এ menu item যোগ
5. Navbar এ "বিক্রেতা হোন" link
6. Email notifications (registration received, approved, rejected) — existing `send-email` function reuse

### Technical notes

- Bengali-first UI, existing design system (Dancing Script + Hind Siliguri, mango yellow palette)
- NID + phone uniqueness check
- Logo upload: existing `ImageCropper` reuse, square 1:1 crop
- Slug auto-generate from shop_name_bn (transliteration), uniqueness check
- পরবর্তী phases এর জন্য schema আগেই extensible রাখা হবে (`vendor_id` columns, commission fields)

---

আমি Phase 1 implement করা শুরু করি? Approve করলে database migration দিয়ে শুরু করবো।