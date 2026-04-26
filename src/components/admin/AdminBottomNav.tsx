import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Settings, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  FolderTree, CreditCard, Truck, Users, Image as ImageIcon,
  DollarSign, BarChart3, X, Mail, MessageSquare, Rocket
} from "lucide-react";

const mainTabs = [
  { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard },
  { title: "অর্ডার", url: "/admin/orders", icon: ShoppingCart },
  { title: "প্রোডাক্ট", url: "/admin/products", icon: Package },
  { title: "সেটিংস", url: "/admin/settings", icon: Settings },
  { title: "আরও", url: "#more", icon: MoreHorizontal },
];

const moreItems = [
  { title: "ক্যাটাগরি", url: "/admin/categories", icon: FolderTree },
  { title: "ব্যানার", url: "/admin/banners", icon: ImageIcon },
  { title: "ল্যান্ডিং পেজ", url: "/admin/landing-pages", icon: Rocket },
  { title: "রিভিউ", url: "/admin/reviews", icon: MessageSquare },
  { title: "পেমেন্ট", url: "/admin/payments", icon: CreditCard },
  { title: "ডেলিভারি", url: "/admin/delivery", icon: Truck },
  { title: "কুরিয়ার চার্জ", url: "/admin/courier-charges", icon: DollarSign },
  { title: "কাস্টমার", url: "/admin/customers", icon: Users },
  { title: "রিপোর্ট", url: "/admin/reports", icon: BarChart3 },
  { title: "ইমেইল", url: "/admin/emails", icon: Mail },
];

const AdminBottomNav = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.url));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMoreOpen(false)} />
      )}

      {/* More menu sheet */}
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
                  isActive(item.url)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate w-full text-center">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
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

export default AdminBottomNav;
