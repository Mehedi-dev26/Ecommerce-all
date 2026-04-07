import {
  LayoutDashboard, Package, ShoppingCart, FolderTree, Users,
  LogOut, Settings, BarChart3, Bell, Globe, ChevronDown, ChevronRight,
  TrendingUp, FileText, HelpCircle, Shield
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/Green_Mango_Logo_1.png";
import { useState } from "react";

const navGroups = [
  {
    label: "মূল মেনু",
    items: [
      { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard, badge: null },
      { title: "অর্ডার", url: "/admin/orders", icon: ShoppingCart, badge: "new" },
    ],
  },
  {
    label: "পণ্য পরিচালনা",
    items: [
      { title: "প্রোডাক্ট", url: "/admin/products", icon: Package, badge: null },
      { title: "ক্যাটাগরি", url: "/admin/categories", icon: FolderTree, badge: null },
    ],
  },
  {
    label: "গ্রাহক ও রিপোর্ট",
    items: [
      { title: "কাস্টমার", url: "/admin/customers", icon: Users, badge: null },
      { title: "রিপোর্ট", url: "/admin/reports", icon: BarChart3, badge: null },
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
          "fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col shadow-2xl",
          "w-[280px] lg:translate-x-0 lg:static lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/50">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-sidebar-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-sidebar-primary/30">
              <img src={logo} alt="Logo" className="h-9 w-9 rounded-lg object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-brand text-xl text-sidebar-primary leading-tight">Sapahar Mango</h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const hasActive = group.items.some(
              (item) =>
                location.pathname === item.url ||
                (item.url !== "/admin" && location.pathname.startsWith(item.url))
            );

            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-2 text-[11px] uppercase tracking-wider font-bold text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
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
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:translate-x-0.5"
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
        <div className="px-3 py-2 border-t border-sidebar-border/30">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>ওয়েবসাইট দেখুন</span>
          </a>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border/30">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/30 mb-2">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground/90 truncate">
                {userEmail || "Admin"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50">অ্যাডমিনিস্ট্রেটর</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:bg-red-500/15 hover:text-red-400 w-full transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            লগআউট
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
