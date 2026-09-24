import {
  LayoutDashboard, Package, ShoppingCart, FolderTree, Users,
  LogOut, Settings, BarChart3, Globe, ChevronDown, ChevronRight,
  Shield, CreditCard, Truck, Image as ImageIcon, DollarSign, MessageSquare, Mail, Rocket, Store, Banknote, Headphones, Wallet, ShieldCheck, ReceiptText
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

const navGroups = [
  {
    label: "মূল মেনু",
    items: [
      { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard, badge: null },
      { title: "অর্ডার", url: "/admin/orders", icon: ShoppingCart, badge: "new" },
      { title: "ভেন্ডর অর্ডার", url: "/admin/vendor-orders", icon: Store, badge: null },
    ],

  },
  {
    label: "পণ্য পরিচালনা",
    items: [
      { title: "প্রোডাক্ট", url: "/admin/products", icon: Package, badge: null },
      { title: "ক্যাটাগরি", url: "/admin/categories", icon: FolderTree, badge: null },
      { title: "ব্যানার", url: "/admin/banners", icon: ImageIcon, badge: null },
      { title: "প্রোমো স্ট্রিপ", url: "/admin/promo-strips", icon: ImageIcon, badge: null },
      { title: "ল্যান্ডিং পেজ", url: "/admin/landing-pages", icon: Rocket, badge: null },
      { title: "গ্রাহক রিভিউ", url: "/admin/reviews", icon: MessageSquare, badge: null },
    ],
  },
  {
    label: "পেমেন্ট ও ডেলিভারি",
    items: [
      { title: "পেমেন্ট গেটওয়ে", url: "/admin/payment-gateway", icon: Wallet, badge: "new" as const },
      { title: "পেমেন্ট Approval", url: "/admin/payment-approvals", icon: ShieldCheck, badge: "new" as const },
      { title: "পেমেন্ট রিপোর্ট", url: "/admin/payments", icon: ReceiptText, badge: null },
      { title: "ডেলিভারি", url: "/admin/delivery", icon: Truck, badge: null },
      { title: "কুরিয়ার চার্জ", url: "/admin/courier-charges", icon: DollarSign, badge: null },
      { title: "কুরিয়ার API", url: "/admin/courier-api", icon: Truck, badge: null },
    ],
  },
  {
    label: "বিক্রেতা ও মার্কেটপ্লেস",
    items: [
      { title: "দোকান নিবন্ধন", url: "/admin/vendors", icon: Store, badge: "new" as const },
      { title: "ভেন্ডর ম্যানেজমেন্ট", url: "/admin/vendor-management", icon: Users, badge: null },
      { title: "ভেন্ডর উত্তোলন", url: "/admin/vendor-withdrawals", icon: Banknote, badge: null },
      { title: "লাইভ সাপোর্ট", url: "/admin/vendor-support", icon: Headphones, badge: "new" as const },
    ],
  },
  {
    label: "গ্রাহক ও রিপোর্ট",
    items: [
      { title: "কাস্টমার", url: "/admin/customers", icon: Users, badge: null },
      { title: "রিপোর্ট", url: "/admin/reports", icon: BarChart3, badge: null },
      { title: "ইমেইল", url: "/admin/emails", icon: Mail, badge: null },
    ],
  },
  {
    label: "সেটিংস",
    items: [
      { title: "সাইট সেটিংস", url: "/admin/settings", icon: Settings, badge: null },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

const AdminSidebar = ({ open, onToggle, onSignOut, userEmail }: AdminSidebarProps) => {
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
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center ring-2 ring-sidebar-primary/40 shadow-lg shadow-sidebar-primary/20">
              <ShoppingBag className="h-6 w-6 text-sidebar-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-brand text-2xl text-sidebar-primary leading-tight drop-shadow-sm">Sapahar Shop</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
        </div>

        {/* Navigation - scrollable with hidden scrollbar and zero white tracks */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);

            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-2 text-[11px] uppercase tracking-wider font-bold text-white/50 hover:text-white/90 transition-colors"
                >
                  <span>{group.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        location.pathname === item.url ||
                        (item.url !== "/admin" && location.pathname.startsWith(item.url));
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

          {/* Quick Actions & Logout inside scroll flow */}
          <div className="pt-4 pb-8 mt-4 border-t border-sidebar-border/30 space-y-2">
            <div className="px-3 pb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                কুইক লিংক ও সেশন
              </span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-sidebar-accent hover:text-white transition-all group"
            >
              <Globe className="h-[18px] w-[18px] flex-shrink-0 text-white/60 group-hover:text-primary group-hover:scale-110 transition-transform" />
              <span className="flex-1">ওয়েবসাইট দেখুন</span>
            </a>

            {/* Admin Info Card */}
            <div className="mx-1 my-2 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/30 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center ring-1 ring-sidebar-primary/30 shrink-0">
                <Shield className="h-4 w-4 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate" title={userEmail || "Admin"}>
                  {userEmail || "Admin"}
                </p>
                <p className="text-[10px] text-white/60">সুপার অ্যাডমিন</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 w-full transition-all duration-200 group text-left"
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="flex-1">লগআউট</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
