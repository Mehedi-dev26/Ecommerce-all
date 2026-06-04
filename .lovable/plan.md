# ভেন্ডর ল্যান্ডিং পেজ সিস্টেম

প্রত্যেক অনুমোদিত ভেন্ডর তার নিজস্ব ব্র্যান্ডিং ও পণ্য দিয়ে অগণিত ল্যান্ডিং পেজ তৈরি করতে পারবে।

## URL স্ট্রাকচার
`/{vendor-slug}/{custom-slug}` — যেমন `/sapahar-shop/aam-offer-2026`
- vendor-slug অংশ স্বয়ংক্রিয়ভাবে ভেন্ডরের `shop_slug` থেকে আসবে (পরিবর্তন অযোগ্য)
- custom-slug ভেন্ডর ইচ্ছামত দেবে
- লেখার সাথে সাথে real-time check হবে — পাওয়া গেলে সবুজ ✓ tick, ব্যবহৃত হলে লাল ✗ এবং বিকল্প সাজেশন

> ⚠️ এই URL ফরম্যাট existing routes (`/products`, `/cart`, `/admin` ইত্যাদি) এর সাথে conflict এড়াতে vendor-slug কখনো reserved word হতে পারবে না। ভেন্ডর slug-এর জন্য reserved list এ ইতিমধ্যে protection আছে।

## ডাটাবেস পরিবর্তন
- `landing_pages` table-এ যোগ:
  - `vendor_id uuid` (nullable — null মানে admin-owned যেমন এখন আছে)
  - composite unique index `(vendor_id, slug)` — একই vendor-এর মধ্যে slug unique
- নতুন RLS policy:
  - ভেন্ডর শুধু নিজের vendor_id-এর পেজ create/update/delete/view করতে পারবে
  - public `/lp/{slug}` এবং `/{vendor-slug}/{slug}` দুটোই কাজ করবে
- নতুন function `check_landing_slug_available(_vendor_id, _slug)` → boolean (real-time tick এর জন্য)
- নতুন function `lookup_vendor_landing_page(_vendor_slug, _custom_slug)` → published page row

## ফ্রন্টএন্ড
1. **নতুন ভেন্ডর পেজ** `/vendor/landing-pages`
   - তালিকা, stats (views/orders/revenue), create/edit/delete
   - admin-এর AdminLandingPages-এর মতই কিন্তু শুধু নিজের পেজ
2. **নতুন এডিটর** `/vendor/landing-pages/new` এবং `/vendor/landing-pages/:id`
   - admin editor-এর সব ফিচার (theme, hero, products, bullets, FAQ, countdown, pixel)
   - product selector শুধু সেই ভেন্ডরের নিজস্ব approved products দেখাবে
   - URL field-এ vendor-slug locked prefix + custom slug input + live availability tick
   - publish/draft দুটোই ভেন্ডর নিজে করতে পারবে
3. **VendorSidebar এ "ল্যান্ডিং পেজ" মেনু** আইটেম যোগ
4. **নতুন route** `/:vendorSlug/:customSlug` → `VendorLandingPageView` (existing `LandingPageView` reuse করে vendor branding যোগ করা)
5. ভেন্ডর ড্যাশবোর্ডে quick stats card

## টেকনিক্যাল বিবরণ
- নতুন lazy routes `App.tsx` এ
- নতুন hook `useLandingSlugCheck(vendorId, slug)` — 400ms debounce + RPC call
- কম্পোনেন্ট shared: existing `AdminLandingPageEditor` কে refactor করে `LandingPageEditorBase` বানানো হবে, যেটি admin ও vendor দুটোতেই কাজ করবে (mode prop)
- conflict resolution: `/:vendorSlug/:customSlug` route Routes-এর সবচেয়ে শেষে বসবে যাতে existing routes-এর সাথে conflict না হয়; vendorSlug প্রথমে `vendors` table-এ লুকআপ করে validate হবে, fail হলে NotFound
- analytics tracking (view_count, order_count) ভেন্ডর পেজে একইভাবে কাজ করবে

## কাজের ধাপ
1. Migration: `landing_pages.vendor_id` + index + RLS + 2টি RPC function
2. Refactor: `AdminLandingPageEditor` → shared `LandingPageEditorBase`
3. নতুন pages: `VendorLandingPages.tsx`, `VendorLandingPageEditor.tsx`
4. নতুন route + view: `VendorLandingPageView.tsx` for `/:vendorSlug/:customSlug`
5. VendorSidebar update
6. App.tsx routes update
