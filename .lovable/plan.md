## সমস্যার মূল কারণ (Root Cause)

Browser network log থেকে নিশ্চিত হলাম — homepage এবং shop page-এ products আসছে না কারণ Supabase API থেকে **HTTP 401 (`permission denied for table products`)** ফিরছে।

```
GET /rest/v1/products?select=*,categories(name_bn)&is_featured=eq.true...
→ 401  code: 42501  "permission denied for table products"
```

কয়েকদিন আগের security migration-এ (`20260508134742…sql`) `cost_price` কলামটি public-এ লুকানোর জন্য করা হয়েছিল:

```sql
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, name, name_bn, … , coming_soon) ON public.products TO anon, authenticated;
GRANT SELECT (cost_price) ON public.products TO authenticated;  -- admin-only
```

কিন্তু frontend-এ এখনো `select("*")` ব্যবহার হচ্ছে। PostgREST `*`-কে cost_price সহ সব কলাম ধরে — anon-এর সেই কলামে access নেই → পুরো query blocked → পণ্য দেখায় না।

Admin login করা থাকলে (authenticated role) সমস্যা হয় না, তাই এতদিন ধরা পড়েনি। Mobile/incognito/customer browser-এ পণ্য দেখায় না।

---

## পরিকল্পনা

### 1) `select("*")` → explicit column list (cost_price বাদে)

তিনটি public-facing query ঠিক করব। Admin queries আগের মতই থাকবে।

- `src/components/FeaturedProducts.tsx` — homepage "জনপ্রিয় পণ্য"
- `src/pages/Products.tsx` — shop / category page
- `src/pages/ProductDetail.tsx` — single product page

প্রত্যেকটিতে select হবে:
```
id, name, name_bn, description, description_bn, category_id, price,
compare_price, stock, image_url, images, weight, unit, grade,
is_active, is_featured, created_at, updated_at, coming_soon,
categories(name, name_bn)
```

এতে cost_price client bundle-এ leak হবে না, security posture অক্ষুণ্ণ থাকবে।

### 2) Professional loading skeleton

বর্তমান skeleton শুধু একটি plain rounded box। Daraz/Amazon-style real-shape skeleton বানাবো যা actual ProductCard-এর হুবহু অবয়ব দেখাবে — image area, category line, title line, weight line, price + cart button row। Tailwind `animate-pulse` সাথে subtle shimmer overlay।

নতুন reusable component: `src/components/ProductCardSkeleton.tsx`

ব্যবহার হবে:
- `FeaturedProducts.tsx` (homepage)
- `Products.tsx` (shop page)

Grid layout হুবহু ProductCard-এর মতো (`grid-cols-2 … lg:grid-cols-4`), তাই content load হলে কোনো layout shift হবে না (better CLS / Core Web Vitals)।

### 3) দ্রুততর product loading

- `select("*")` → explicit columns মানে payload ছোট (cost_price ও বাদ)।
- React Query এর existing `staleTime: 10m` cache পুনরায় visit-এ instant render দেবে।
- FeaturedProducts query-তে `staleTime: 60_000` আছে — সেটি 10 minute করে homepage repeat-visit cost কমাব।

### Verification

1. Browser network log-এ `/rest/v1/products` request **200 OK** ফেরত আসবে।
2. Incognito (logged-out) homepage-এ পণ্য দেখাবে।
3. Loading state-এ নতুন skeleton card render হবে — পণ্য আসার পর কোনো jump ছাড়াই replace হবে।

### Out of scope

Database/RLS-এ কোনো পরিবর্তন আনছি না — security migration সঠিক, শুধু client query-গুলো সেটির সাথে aligned করা দরকার।
