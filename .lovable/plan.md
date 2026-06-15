## লক্ষ্য
Sapahar Shop-এর existing checkout-এ bKash/Nagad/Rocket payment + SMS-based auto-verification যোগ করা। Advance payment ও full payment — দুটোতেই কাজ করবে। SMS forwarder থেকে আসা SMS Supabase Edge Function পার্স করে automatically order match করে paid করবে।

## ১. Database (migration)
- `payment_accounts` টেবিল: id, method (bkash/nagad/rocket), account_number, account_type (personal/merchant), logo_url, instructions_bn, is_active, sort_order
- `sms_inbox` টেবিল: id, raw_message, sender_address, provider, amount, txn_id, sender_number, received_at, matched_order_id (fk orders), matched_at, status (unmatched/matched/duplicate/invalid)
- `orders` টেবিলে নতুন column: `payment_provider` (bkash/nagad/rocket/cod), `payment_sender_number`, `payment_txn_id`, `payment_verified_at`, `payment_expected_amount` (advance বা total)
- `site_settings`-এ নতুন key: `sms_webhook` (secret token, allowed senders, tolerance)
- সব নতুন টেবিলে GRANT + RLS (admin manage; webhook service_role; user নিজের order এর txn দেখতে পাবে)
- বিদ্যমান data নষ্ট না করে শুধু ALTER ADD COLUMN

## ২. Checkout UI (3-step flow)
File: নতুন `src/components/checkout/MobilePaymentFlow.tsx`, `src/pages/Checkout.tsx` update।

বর্তমান COD-only payment section বদলে যাবে:
- **Step 1 — Method:** COD | bKash (pink) | Nagad (orange) | Rocket (purple) gradient card
- **Step 2 — Account screen:** merchant number (one-tap copy), payable amount (advance থাকলে advance, না থাকলে full), Bangla instructions, sender number input (regex `^01[3-9]\d{8}$`, +880 normalize), real-time validation
- **Step 3 — Waiting screen:** spinner, "অর্ডার যাচাই হচ্ছে…", 3s interval `recheckPayment` poll, success → OrderSuccess page, 10min timeout এ manual recheck button

Confirm button click হলে **আগে order create হবে (pending payment_verified=false), সাথে সাথে waiting screen-এ navigate** — await করবে না UI block-এর জন্য।

## ৩. SMS Webhook (Edge Function)
File: `supabase/functions/sms-webhook/index.ts` (public, verify_jwt=false)
- Header `x-webhook-token` site_settings.sms_webhook.secret-এর সাথে match
- Provider parsers (regex): bKash `TrxID`, Nagad `TxnID`, Rocket `TxnId`
- `sms_inbox`-এ insert
- Auto-match: same amount (±1৳), last 11 digit sender match, last 30 min-এর pending order, payment_provider মিল
- Match হলে `orders.payment_verified_at`, `payment_txn_id` set; advance order হলে `advance_paid=true`, full হলে `status='confirmed'`
- URL: `https://wqdirlxffyfplbhiadou.supabase.co/functions/v1/sms-webhook`

## ৪. Admin Panel
নতুন route `/admin/payment-gateway` (existing `/admin/payments` finance-related, তাই আলাদা):
- **Accounts tab:** bKash/Nagad/Rocket-এর জন্য number, type, instruction, active toggle (CRUD on `payment_accounts`)
- **Webhook tab:** webhook URL (copy), secret token (regenerate), test payload sender, recent SMS log (last 50, match status badge)
- **Pending payments tab:** advance/full pending order, manual approve/reject, auto-refresh 10s

AdminSidebar-এ নতুন link "পেমেন্ট গেটওয়ে"। admin role check `has_role` দিয়ে server-side।

## ৫. Order Success ও Tracking
- OrderSuccess page-এ payment status badge ("পেমেন্ট যাচাইকৃত ✓" বা "যাচাই অপেক্ষমাণ")
- UserDashboard-এ order list-এ txn_id ও payment status দেখানো
- AdminOrders-এ filter "Payment pending", payment column যোগ

## ৬. কী stack-adaptation
Prompt-এ TanStack Start + createServerFn বলা ছিল, কিন্তু এই project React 18 + Vite + Supabase। সমস্ত server logic Supabase Edge Function-এ যাবে; client থেকে `supabase.functions.invoke()`। বাকি UX/design/flow হুবহু same।

## ৭. বাদ থাকছে (separate request করতে হবে)
- Smart Investor packages, user_packages, referral commission, community chat — এগুলো আলাদা module, আজ skip
- Real-time payment gateway API (bKash/Nagad official API) — পরে integrate

## ক্রম
1. Migration (payment_accounts, sms_inbox, orders columns, site_settings key)
2. sms-webhook edge function
3. Admin payment-gateway page + sidebar link
4. Checkout 3-step UI + recheckPayment client logic
5. OrderSuccess/Dashboard/AdminOrders badge update

প্রস্তুত হলে confirm করুন — শুরু করব।