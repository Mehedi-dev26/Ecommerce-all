# ZiniPay-style Payment Flow

আপনার তিনটি ছবি অনুযায়ী checkout থেকে আলাদা আলাদা page-এ payment flow তৈরি করব। প্রতিটি step আলাদা route, hubohu image-এর design।

## Flow Overview

```text
Checkout (form fill) 
   ↓ [Place Order click]
Order create (status=pending_payment) 
   ↓
/payment/:orderId                  ← Image 1 (method picker)
   ↓ [bKash/Nagad/Rocket select]
/payment/:orderId/number           ← Image 2 (provider themed number entry)
   ↓ [Confirm]
/payment/:orderId/waiting          ← Image 3 (merchant number + instructions + waiting)
   ↓ 30s auto-poll for SMS match
   ├─ matched → /payment/:orderId/success
   └─ not matched → "Try Again" (2x, each 30s)
        └─ after 2 tries → "Submit Transaction ID" form
             ↓
        order stays pending, admin verifies later OR webhook auto-matches when SMS arrives
```

COD নির্বাচন করলে সরাসরি `/order-success` এ যাবে (current flow)।

## Pages (আলাদা routes)

1. **`/payment/:orderId`** — `PaymentMethodSelect.tsx`
   - Top: brand logo + "Order #SM-0001" + invoice ID copy button
   - Support/Call icons (vendor contact)
   - Tab: Mobile Banking / International (international disabled MVP)
   - Grid: bKash, Nagad, Rocket cards (active accounts থেকে; logo দেখাবে)
   - Bottom sticky: "Pay ৳{amount}" button

2. **`/payment/:orderId/number`** — `PaymentNumberEntry.tsx`
   - Provider-themed background (bKash=pink #E2136E, Nagad=orange #EE7F25, Rocket=purple #8C3494)
   - Top white header with provider logo
   - Order summary row (cart icon + product name + amount)
   - Center: "Your {Provider} Account Number" + large input (sender number)
   - Bottom: Cancel / Confirm buttons
   - BD phone validation

3. **`/payment/:orderId/waiting`** — `PaymentWaiting.tsx`
   - Provider-themed
   - "MERCHANT NUMBER" box with copy button (admin-configured account number)
   - Numbered Bengali instructions (1, 2, 3) + bKash app screenshot illustration
   - "Waiting for payment..." pulsing text
   - Bottom: Cancel + Waiting button (30s countdown)
   - **30s timer**: poll `orders.payment_status` every 3s
     - matched → success route
     - timeout → enable "Try Again" (counter: 1/2, 2/2)
     - after 2nd timeout → "Submit Transaction ID" form appears
   - Submit txn ID → save to `orders.payment_txn_id`, status stays `pending_verification`
   - Toast: "আমরা SMS পেলে automatically confirm হয়ে যাবে, না হলে admin verify করবে"

4. **`/payment/:orderId/success`** — `PaymentSuccess.tsx`
   - Green checkmark animation
   - Order number, amount, txn ID
   - "Track Order" / "Continue Shopping" buttons

## Backend Changes

**Migration:**
- `orders` add columns: `payment_txn_id text`, `payment_sender_number text` (if missing), `payment_attempt_count int default 0`
- `orders.payment_status` enum values used: `pending`, `pending_verification`, `paid`, `failed`

**SMS Webhook (already exists, enhance):**
- বর্তমান webhook amount±1 + sender + 24h match করে। যোগ করব:
  - Match on `payment_txn_id` যদি customer submit করে থাকে
  - Realtime: orders table-এ update broadcast → waiting page তাত্ক্ষণিক success-এ যাবে (`supabase.channel` subscription)
- Enable realtime on `orders` table

**Checkout.tsx changes:**
- COD → unchanged
- bKash/Nagad/Rocket → order create with `payment_status='pending'`, then `navigate('/payment/' + orderId)`
- Sender number input PaymentMethodPicker থেকে সরিয়ে number entry page-এ নেওয়া হবে

## Technical Details

- **Provider themes**: `src/lib/payment-themes.ts` — color, logo, name per method
- **Realtime polling**: `useEffect` + `supabase.channel('order-'+id).on('postgres_changes', ...)` + 3s fallback poll
- **Try again counter**: localStorage `payment_attempts_${orderId}` (survives page reload)
- **Auto-match on late SMS**: webhook already matches; if order is `pending_verification` with txn ID, prefer txn match
- **Realtime cleanup**: `removeChannel` in useEffect return (per project rule)
- **Bengali text**: instructions, buttons all in Bangla per project standard

## Files

**Create:**
- `src/pages/payment/PaymentMethodSelect.tsx`
- `src/pages/payment/PaymentNumberEntry.tsx`
- `src/pages/payment/PaymentWaiting.tsx`
- `src/pages/payment/PaymentSuccess.tsx`
- `src/lib/payment-themes.ts`

**Edit:**
- `src/App.tsx` (4 new lazy routes)
- `src/pages/Checkout.tsx` (redirect to /payment/:id for mobile banking)
- `supabase/functions/sms-webhook/index.ts` (txn_id matching + realtime notify)

**Migration:**
- Add `payment_txn_id`, `payment_attempt_count` columns + enable realtime on orders

## Out of Scope (this iteration)
- International payment tab (disabled placeholder)
- QR code payments
- Real-time payment gateway API (bKash PGW) — manual SMS-match only, যেমনটা current architecture
