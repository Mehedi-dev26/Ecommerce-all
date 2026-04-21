# Project Memory

## Core
- Brand: Surzo Shop. Modern Indigo (primary 243 75% 55%) + White, Poppins (brand) & Hind Siliguri (body).
- General e-commerce: Electronics, Home Appliances, Bicycles & Vehicles. Sold by piece (some by weight where relevant).
- Auth: Google OAuth + Email. Login required before checkout.
- Dynamic shipping by location (Division > District > Upazila) & weight. Real-time calculation.
- Orders manually verified by admin before sending to Pathao via Supabase Edge Function.
- Revenue analytics ONLY count 'delivered' orders.
- Caching: React.lazy, QueryClient (5m), updated_at cache busting for banners.
- Vite constraint: Dedupe `@radix-ui` to avoid hook errors.

## Memories
- [Contact Info](mem://brand/contact-info) — Official business phone numbers
- [Product Descriptions](mem://content/product-descriptions) — Bilingual (Bengali/English) requirements
- [Mobile Layout](mem://ui/mobile-layout) — Mobile grid and banner behavior
- [Hero Banner](mem://ui/hero-banner) — Slider specs, dimensions, and shimmer effects
- [Product Page Layout](mem://ui/product-page) — 5-column grid, trust signals, descriptions
- [Shop Filters](mem://ui/shop-filters) — Sidebar and mobile drawer layout
- [Checkout System](mem://features/checkout-system) — Validation and order verification flow
- [Abandoned Checkout](mem://features/abandoned-checkout) — 3s debounce auto-save for incomplete orders
- [Authentication Flow](mem://auth/authentication-system) — Split layout UI and login providers
- [User Dashboard](mem://features/user-dashboard) — Unified tracking and order history
- [Admin Panel Layout](mem://features/admin-panel) — Grouped navigation, fixed sidebar, rounded-2xl dialogs
- [Admin Access](mem://tech/admin-access) — Supabase user_roles setup
- [Admin Customer Management](mem://features/admin-customer-management) — LTV calculation and history
- [Admin Invoices](mem://features/admin-invoices) — Print-ready shop and Pathao invoices
- [Admin Image Management](mem://features/admin-image-management) — react-easy-crop integration
- [Performance & Caching](mem://tech/performance) — Code splitting, image priority, caching
- [Vite Config](mem://tech/vite-config) — Radix UI deduplication constraint
- [Pathao Courier](mem://integrations/pathao-courier) — Edge function, dynamic store ID, live sync
- [Order Management](mem://features/order-management) — 'SM-0001' IDs and copy actions
- [Dynamic Shipping](mem://features/dynamic-shipping) — Location and weight-based rate calculation
- [Product Customization](mem://features/product-customization) — Weight selection and real-time pricing
- [Payment Tracking](mem://features/payment-tracking) — COD, bKash, Nagad tracking
- [Revenue Analytics](mem://features/revenue-analytics) — 'Delivered' orders metric and cancelled costs
- [Site Settings](mem://features/site-settings) — Dynamic footer and metadata
