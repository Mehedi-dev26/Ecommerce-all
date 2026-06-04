import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";

// Heavy / below-the-fold pieces — defer to keep initial JS small.
const Footer = lazy(() => import("@/components/Footer"));
const SupportWidget = lazy(() => import("@/components/SupportWidget"));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav"));
const FloatingCart = lazy(() => import("@/components/FloatingCart"));
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

// Minimal top progress bar shown ONLY during route lazy-load.
// We deliberately avoid a full-screen PageLoader on every navigation —
// users should perceive instant transitions (Daraz/Amazon style).
const RouteFallback = () => (
  <div className="fixed top-0 left-0 right-0 z-[70] h-0.5 overflow-hidden bg-transparent">
    <div className="h-full w-1/3 bg-primary animate-[loader-slide_1s_ease-in-out_infinite]" />
  </div>
);

// Lazy load public pages
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const VendorRegister = lazy(() => import("./pages/VendorRegister"));
const Install = lazy(() => import("./pages/Install"));
const VendorShop = lazy(() => import("./pages/VendorShop"));
const VendorLayout = lazy(() => import("./layouts/VendorLayout"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorProducts = lazy(() => import("./pages/vendor/VendorProducts"));
const VendorOrders = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorEarnings = lazy(() => import("./pages/vendor/VendorEarnings"));
const VendorWithdrawals = lazy(() => import("./pages/vendor/VendorWithdrawals"));
const VendorShopSettings = lazy(() => import("./pages/vendor/VendorShopSettings"));
const VendorLandingPages = lazy(() => import("./pages/vendor/VendorLandingPages"));
const VendorLandingPageEditor = lazy(() => import("./pages/vendor/VendorLandingPageEditor"));

// Lazy load admin pages — bundled separately to avoid bloating the public bundle
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCourierCharges = lazy(() => import("./pages/admin/AdminCourierCharges"));
const AdminCourierApi = lazy(() => import("./pages/admin/AdminCourierApi"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminLandingPages = lazy(() => import("./pages/admin/AdminLandingPages"));
const AdminLandingPageEditor = lazy(() => import("./pages/admin/AdminLandingPageEditor"));
const AdminVendors = lazy(() => import("./pages/admin/AdminVendors"));
const AdminVendorManagement = lazy(() => import("./pages/admin/AdminVendorManagement"));
const LandingPageView = lazy(() => import("./pages/LandingPageView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

// Prefetch likely-next routes on idle so navigation feels instant
const prefetchRoutes = () => {
  const idle = (cb: () => void) =>
    "requestIdleCallback" in window
      ? (window as any).requestIdleCallback(cb)
      : setTimeout(cb, 1500);
  idle(() => {
    void import("./pages/Products");
    void import("./pages/ProductDetail");
    void import("./pages/Cart");
  });
};

const App = () => {
  // Remove the initial HTML loader once React has mounted
  useEffect(() => {
    const el = document.getElementById("initial-loader");
    if (!el) return;
    el.classList.add("fade-out");
    const t = setTimeout(() => el.remove(), 400);
    prefetchRoutes();
    return () => clearTimeout(t);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SiteSettingsProvider>
          <CartProvider>
          <Suspense fallback={null}>
            <Toaster />
            <Sonner />
          </Suspense>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public Landing Pages (custom slugs) — no Navbar/Footer */}
                <Route path="/lp/:slug" element={<LandingPageView />} />
                {/* Vendor public landing pages: /{vendor-slug}/{custom-slug} */}
                <Route path="/:vendorSlug/:customSlug" element={<LandingPageView />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="delivery" element={<AdminDelivery />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="courier-charges" element={<AdminCourierCharges />} />
                  <Route path="courier-api" element={<AdminCourierApi />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="emails" element={<AdminEmails />} />
                  <Route path="landing-pages" element={<AdminLandingPages />} />
                  <Route path="landing-pages/new" element={<AdminLandingPageEditor />} />
                  <Route path="landing-pages/:id" element={<AdminLandingPageEditor />} />
                  <Route path="vendors" element={<AdminVendors />} />
                  <Route path="vendor-management" element={<AdminVendorManagement />} />
                </Route>

                {/* Vendor Routes */}
                <Route path="/vendor" element={<VendorLayout />}>
                  <Route path="dashboard" element={<VendorDashboard />} />
                  <Route path="products" element={<VendorProducts />} />
                  <Route path="orders" element={<VendorOrders />} />
                  <Route path="earnings" element={<VendorEarnings />} />
                  <Route path="withdrawals" element={<VendorWithdrawals />} />
                  <Route path="shop-settings" element={<VendorShopSettings />} />
                </Route>

                {/* Public Routes */}
                <Route
                  path="*"
                  element={
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/products/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/dashboard" element={<UserDashboard />} />
                          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                          <Route path="/terms-conditions" element={<TermsConditions />} />
                          <Route path="/vendor/register" element={<VendorRegister />} />
                          <Route path="/install" element={<Install />} />
                          <Route path="/shop/:slug" element={<VendorShop />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Suspense fallback={<div className="h-64" aria-hidden />}><Footer /></Suspense>
                      <Suspense fallback={null}><SupportWidget /></Suspense>
                      <Suspense fallback={null}><MobileBottomNav /></Suspense>
                      <Suspense fallback={null}><FloatingCart /></Suspense>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </CartProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
