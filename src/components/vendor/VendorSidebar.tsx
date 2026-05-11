import {
  LayoutDashboard, Package, ShoppingCart, Wallet, Banknote,
  Settings, LogOut, Globe, ChevronDown, ChevronRight, Store, ShoppingBag,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navGroups = [
  {
    label: "মূল মেনু",
    items: [
      { title: "ড্যাশবোর্ড", url: "/vendor/dashboard", icon: LayoutDashboard, badge: null },
      { title: "অর্ডার", url: "/vendor/orders", icon: ShoppingCart, badge: "new" as const },
    ],
  },
  {
    label: "পণ্য পরিচালনা",
    items: [
      { title: "আমার পণ্য", url: "/vendor/products", icon: Package, badge: null },
    ],
  },
  {
    label: "আয় ও উত্তোলন",
    items: [
      { title: "আয়", url: "/vendor/earnings", icon: Wallet, badge: null },
      { title: "টাকা উত্তোলন", url: "/vendor/withdrawals", icon: Banknote, badge: null },
    ],
  },
  {
    label: "সেটিংস",
    items: [
      { title: "শপ সেটিংস", url: "/vendor/shop-settings", icon: Settings, badge: null },
    ],
  },
];

interface VendorSidebarProps {
  open: boolean;
  onToggle: () => void;
  onSignOut: () => void;
  shopName?: string;
  ownerName?: string;
  logoUrl?: string | null;
  commissionPercent?: number;
}

const VendorSidebar = ({ open, onToggle, onSignOut, shopName, ownerName, logoUrl, commissionPercent }: VendorSidebarProps) => {
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
          "w-[280px] lg:relative lg:translate-x-0",
          "overflow-hidden shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/50 bg-gradient-to-r from-sidebar-accent/40 to-transparent">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center ring-2 ring-sidebar-primary/40 shadow-lg shadow-sidebar-primary/20 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag className="h-6 w-6 text-sidebar-primary-foreground" strokeWidth={2.5} />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-brand text-xl text-sidebar-primary leading-tight drop-shadow-sm truncate">
              {shopName || "Sapahar Shop"}
            </h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Vendor Panel</p>
          </div>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-2 text-[11px] uppercase tracking-wider font-bold text-white/50 hover:text-white/90 transition-colors"
                >
                  <span>{group.label}</span>
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        location.pathname === item.url ||
                        (item.url !== "/vendor/dashboard" && location.pathname.startsWith(item.url));
                      return (
                        <NavLink
                          key={item.url}
                          to={item.url}
                          onClick={() => {
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 font-semibold"
                              : "text-white/80 hover:bg-sidebar-accent hover:text-white hover:translate-x-0.5"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] flex-shrink-0 transition-transform",
                              isActive ? "" : "group-hover:scale-110"
                            )}
                          />
                          <span className="flex-1">{item.title}</span>
                          {item.badge === "new" && (
                            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Links */}
        <div className="shrink-0 px-3 py-2 border-t border-sidebar-border/30">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-white/70 hover:bg-sidebar-accent hover:text-white transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>ওয়েবসাইট দেখুন</span>
          </a>
        </div>

        {/* User Section */}
        <div className="shrink-0 p-3 border-t border-sidebar-border/30">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50 mb-2">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center ring-1 ring-sidebar-primary/30">
              <Store className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {ownerName || "Vendor"}
              </p>
              <p className="text-[10px] text-white/60">কমিশন: {commissionPercent ?? 0}%</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 w-full transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            লগআউট
          </button>
        </div>
      </aside>
    </>
  );
};

export default VendorSidebar;
