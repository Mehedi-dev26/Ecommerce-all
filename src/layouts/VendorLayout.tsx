import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/hooks/useVendor";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  BanknoteArrowDown,
  Settings,
  LogOut,
  Loader2,
  Store,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/vendor/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { to: "/vendor/products", icon: Package, label: "আমার পণ্য" },
  { to: "/vendor/orders", icon: ShoppingBag, label: "অর্ডার" },
  { to: "/vendor/earnings", icon: Wallet, label: "আয়" },
  { to: "/vendor/withdrawals", icon: BanknoteArrowDown, label: "টাকা উত্তোলন" },
  { to: "/vendor/shop-settings", icon: Settings, label: "শপ সেটিংস" },
];

const VendorLayout = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { vendor, loading: vendorLoading } = useVendor();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/vendor/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || vendorLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Status gating
  if (!vendor) {
    return (
      <StatusScreen
        icon={Store}
        color="text-amber-600"
        title="আপনি এখনো বিক্রেতা নন"
        desc="ড্যাশবোর্ড অ্যাক্সেস পেতে প্রথমে দোকান নিবন্ধন করুন।"
        actionLabel="দোকান নিবন্ধন করুন"
        action={() => navigate("/vendor/register")}
      />
    );
  }

  if (vendor.status === "pending") {
    return (
      <StatusScreen
        icon={Clock}
        color="text-amber-600"
        title="আবেদন পর্যালোচনাধীন"
        desc="অ্যাডমিন আপনার আবেদন রিভিউ করছে। অনুমোদন হলে আপনি ড্যাশবোর্ড পাবেন।"
        actionLabel="হোমে ফিরে যান"
        action={() => navigate("/")}
      />
    );
  }

  if (vendor.status === "rejected") {
    return (
      <StatusScreen
        icon={XCircle}
        color="text-destructive"
        title="আবেদন প্রত্যাখ্যাত"
        desc={vendor.rejection_reason || "অ্যাডমিনের সাথে যোগাযোগ করুন।"}
        actionLabel="আবার আবেদন করুন"
        action={() => navigate("/vendor/register")}
      />
    );
  }

  if (vendor.status === "suspended") {
    return (
      <StatusScreen
        icon={AlertTriangle}
        color="text-destructive"
        title="দোকান সাময়িকভাবে স্থগিত"
        desc="অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
        actionLabel="হোমে ফিরে যান"
        action={() => navigate("/")}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border/60">
        <div className="p-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{vendor.shop_name_bn}</p>
              <p className="text-[11px] text-muted-foreground truncate">কমিশন: {vendor.commission_percent}%</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/vendor/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> লগআউট
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="font-bold text-sm truncate">{vendor.shop_name_bn}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/60 grid grid-cols-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/vendor/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="leading-tight text-center px-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

const StatusScreen = ({
  icon: Icon,
  color,
  title,
  desc,
  actionLabel,
  action,
}: {
  icon: any;
  color: string;
  title: string;
  desc: string;
  actionLabel: string;
  action: () => void;
}) => (
  <div className="container mx-auto max-w-xl py-20 px-4 text-center">
    <Icon className={cn("h-20 w-20 mx-auto mb-4", color)} />
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground mb-6">{desc}</p>
    <Button onClick={action}>{actionLabel}</Button>
  </div>
);

export default VendorLayout;
