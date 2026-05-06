## Goal
Build a centralized "Courier API" admin section where you can manage Pathao + Steadfast (and future couriers) credentials from the UI, and let admins choose which courier to send each order through.

---

## 1. Database (new migration)

**Table: `courier_providers`** (admin-only RLS)
- `id` uuid
- `provider_key` text unique — e.g. `pathao`, `steadfast`
- `display_name` text — e.g. "Pathao", "Steadfast"
- `is_active` boolean (enable/disable from UI)
- `is_default` boolean (one default for quick send)
- `credentials` jsonb — provider-specific keys (see below)
- `sort_order` int
- `created_at`, `updated_at`

**Credentials JSON shape**
- Pathao: `{ client_id, client_secret, username, password, base_url, store_id }`
- Steadfast: `{ api_key, secret_key, base_url }`

RLS: only admins can SELECT / INSERT / UPDATE / DELETE. Never exposed to public.

Seed row for Pathao (empty creds — admin fills in via UI). The existing `PATHAO_*` env secrets stay as fallback.

**Add to `orders` table:**
- `courier_provider` text — which courier was used (`pathao` | `steadfast`)
- `courier_tracking_id` text — generic tracking id (Steadfast consignment id)
- Keep existing `pathao_consignment_id` / `pathao_tracking_url` / `pathao_order_status` for backward compat

---

## 2. Edge functions

### Update `supabase/functions/pathao/index.ts`
- On every call, first try to load Pathao credentials from `courier_providers` table (using service role).
- Fall back to `PATHAO_*` env vars if DB row is empty.
- Same actions (`get-stores`, `get-cities`, `get-zones`, `get-areas`, `price-calc`, `create-order`, `track-order`).

### New `supabase/functions/steadfast/index.ts`
- Loads Steadfast `api_key` + `secret_key` from `courier_providers`.
- Actions:
  - `create-order` — POST to `https://portal.packzy.com/api/v1/create_order` with headers `Api-Key`, `Secret-Key`. Body: `invoice`, `recipient_name`, `recipient_phone`, `recipient_address`, `cod_amount`, `note`. Saves `consignment_id` + tracking URL onto `orders`.
  - `track-order` — GET `/status_by_cid/{cid}`, updates `pathao_order_status` field reused as generic status.
  - `verify-credentials` — quick auth check (`/get_balance`).

CORS + service-role-key DB writes mirror the existing Pathao function.

---

## 3. Admin UI

### New page `src/pages/admin/AdminCourierApi.tsx`
Route: `/admin/courier-api`. Add to admin sidebar under "Settings" group with a Truck icon.

Layout: Tabs for each provider (Pathao | Steadfast | + Add Courier later).

**Pathao tab**
- Inputs: Client ID, Client Secret, Username, Password, Base URL (default prefilled), Store ID
- "Test Connection" button → calls `pathao?action=get-stores`, shows success/fail toast
- "Set as default courier" toggle
- "Active" toggle
- Save button → upserts into `courier_providers`

**Steadfast tab**
- Inputs: API Key, Secret Key, Base URL (default `https://portal.packzy.com/api/v1`)
- "Test Connection" → calls `steadfast?action=verify-credentials`
- Active / default toggles
- Save button

Professional design: shadcn `Card` + `Tabs`, masked password fields with eye toggle, status badges (Connected / Not configured), help links to each provider's docs.

### Update `src/pages/admin/AdminOrders.tsx`
The existing "পাঠাও পাঠান" button becomes a **dropdown / dialog**:
- Shows list of active couriers from `courier_providers` (default highlighted).
- Pathao path: keep current city/zone/area selector flow.
- Steadfast path: simpler dialog (no zone selection — Steadfast resolves by address). Confirms COD amount, then calls `steadfast?action=create-order`.
- After success, save `courier_provider`, tracking id, tracking URL on the order.

Tracking column shows the right link based on `courier_provider`.

---

## 4. Files touched

New:
- `supabase/migrations/<ts>_courier_providers.sql`
- `supabase/functions/steadfast/index.ts`
- `src/pages/admin/AdminCourierApi.tsx`

Edited:
- `supabase/functions/pathao/index.ts` — load creds from DB with env fallback
- `src/App.tsx` — register `/admin/courier-api` route
- `src/components/admin/AdminSidebar.tsx` — add nav item
- `src/pages/admin/AdminOrders.tsx` — multi-courier send flow
- `src/integrations/supabase/types.ts` — auto-regenerated after migration

---

## 5. Security notes
- Credentials live in `courier_providers.credentials` jsonb, admin-only RLS, never returned to public client.
- Edge functions read creds via service-role key (server-side only).
- Frontend admin UI fetches creds only via authenticated admin session (RLS enforced).
- "Test Connection" calls go through edge functions — secrets never leave the server after save.

---

## 6. Out of scope (can add later)
- RedX, Paperfly, eCourier providers (table is generic — just add new tab + edge function).
- Bulk send to courier.
- Auto-sync delivery status via cron.

Confirm and I'll start with the migration.