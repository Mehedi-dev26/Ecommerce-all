import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Wallet, MoreHorizontal, Banknote, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainTabs = [
  { title: "ড্যাশবোর্ড", url: "/vendor/dashboard", icon: LayoutDashboard },
  { title: "অর্ডার", url: "/vendor/orders", icon: ShoppingCart },
  { title: "পণ্য", url: "/vendor/products", icon: Package },
  { title: "আয়", url: "/vendor/earnings", icon: Wallet },
  { title: "আরও", url: "#more", icon: MoreHorizontal },
];

const moreItems = [
  { title: "টাকা উত্তোলন", url: "/vendor/withdrawals", icon: Banknote },
  { title: "শপ সেটিংস", url: "/vendor/shop-settings", icon: Settings },
];

const VendorBottomNav = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (url: string) => {
    if (url === "/vendor/dashboard") return location.pathname === "/vendor/dashboard";
    return location.pathname.startsWith(url);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.url));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMoreOpen(false)} />
      )}

      {moreOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 lg:hidden bg-card border-t border-border rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">আরও মেনু</h3>
            <button onClick={() => setMoreOpen(false)} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all",
                  isActive(item.url) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate w-full text-center">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-[60px] px-1">
          {mainTabs.map((tab) => {
            if (tab.url === "#more") {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                    isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.title}</span>
                </button>
              );
            }
            const active = isActive(tab.url);
            return (
              <NavLink
                key={tab.url}
                to={tab.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn("p-1 rounded-lg transition-colors", active && "bg-primary/10")}>
                  <tab.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{tab.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default VendorBottomNav;
