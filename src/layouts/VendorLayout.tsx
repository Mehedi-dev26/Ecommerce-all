import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/hooks/useVendor";
import { Button } from "@/components/ui/button";
import VendorSidebar from "@/components/vendor/VendorSidebar";
import VendorBottomNav from "@/components/vendor/VendorBottomNav";
import PageLoader from "@/components/PageLoader";
import { Menu, RefreshCw, Store, Clock, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import VendorNotificationCenter from "@/components/vendor/VendorNotificationCenter";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/vendor/dashboard": { title: "ড্যাশবোর্ড", subtitle: "আপনার দোকানের সারসংক্ষেপ" },
  "/vendor/products": { title: "আমার পণ্য", subtitle: "পণ্য পরিচালনা ও স্টক" },
  "/vendor/orders": { title: "অর্ডার", subtitle: "আপনার অর্ডার ট্র্যাকিং" },
  "/vendor/earnings": { title: "আয়", subtitle: "আপনার আয়ের বিশ্লেষণ" },
  "/vendor/withdrawals": { title: "টাকা উত্তোলন", subtitle: "উত্তোলন অনুরোধ ও ইতিহাস" },
  "/vendor/shop-settings": { title: "শপ সেটিংস", subtitle: "দোকানের তথ্য পরিচালনা" },
  "/vendor/landing-pages": { title: "ল্যান্ডিং পেজ", subtitle: "আপনার নিজস্ব কাস্টম পেজ তৈরি ও পরিচালনা" },
};

const VendorLayout = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { vendor, loading: vendorLoading } = useVendor();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/vendor/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || vendorLoading) {
    return <PageLoader fullScreen message="ভেন্ডর প্যানেল লোড হচ্ছে" />;
  }

  if (!user) return null;

  if (!vendor) {
    return (
      <StatusScreen icon={Store} color="text-amber-600"
        title="আপনি এখনো বিক্রেতা নন"
        desc="ড্যাশবোর্ড অ্যাক্সেস পেতে প্রথমে দোকান নিবন্ধন করুন।"
        actionLabel="দোকান নিবন্ধন করুন"
        action={() => navigate("/vendor/register")} />
    );
  }
  if (vendor.status === "pending") {
    return (
      <StatusScreen icon={Clock} color="text-amber-600"
        title="আবেদন পর্যালোচনাধীন"
        desc="অ্যাডমিন আপনার আবেদন রিভিউ করছে। অনুমোদন হলে আপনি ড্যাশবোর্ড পাবেন।"
        actionLabel="হোমে ফিরে যান" action={() => navigate("/")} />
    );
  }
  if (vendor.status === "rejected") {
    return (
      <StatusScreen icon={XCircle} color="text-destructive"
        title="আবেদন প্রত্যাখ্যাত"
        desc={vendor.rejection_reason || "অ্যাডমিনের সাথে যোগাযোগ করুন।"}
        actionLabel="আবার আবেদন করুন" action={() => navigate("/vendor/register")} />
    );
  }
  if (vendor.status === "suspended") {
    return (
      <StatusScreen icon={AlertTriangle} color="text-destructive"
        title="দোকান সাময়িকভাবে স্থগিত"
        desc="অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
        actionLabel="হোমে ফিরে যান" action={() => navigate("/")} />
    );
  }

  const currentPage = pageTitles[location.pathname] || { title: "ভেন্ডর", subtitle: "" };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-muted/40">
      <VendorSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={handleSignOut}
        shopName={vendor.shop_name_bn}
        ownerName={vendor.owner_name}
        logoUrl={vendor.logo_url}
        commissionPercent={vendor.commission_percent}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">{currentPage.title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{currentPage.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <VendorNotificationCenter vendorId={vendor.id} vendorName={vendor.shop_name_bn || vendor.owner_name} />
              <div className="h-8 w-px bg-border hidden md:block" />
              <div className="hidden md:flex items-center gap-2 pl-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {vendor.owner_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        <footer className="shrink-0 border-t border-border/50 bg-card/50 px-4 lg:px-8 py-3 hidden lg:block">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Sapahar Shop — Vendor Panel</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>

      <VendorBottomNav />
    </div>
  );
};

const StatusScreen = ({
  icon: Icon, color, title, desc, actionLabel, action,
}: {
  icon: any; color: string; title: string; desc: string; actionLabel: string; action: () => void;
}) => (
  <div className="container mx-auto max-w-xl py-20 px-4 text-center">
    <Icon className={cn("h-20 w-20 mx-auto mb-4", color)} />
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground mb-6">{desc}</p>
    <Button onClick={action}>{actionLabel}</Button>
  </div>
);

export default VendorLayout;
