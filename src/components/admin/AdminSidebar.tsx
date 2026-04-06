import { LayoutDashboard, Package, ShoppingCart, FolderTree, Users, LogOut, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/Green_Mango_Logo_1.png";

const navItems = [
  { title: "ড্যাশবোর্ড", url: "/admin", icon: LayoutDashboard },
  { title: "প্রোডাক্ট", url: "/admin/products", icon: Package },
  { title: "অর্ডার", url: "/admin/orders", icon: ShoppingCart },
  { title: "ক্যাটাগরি", url: "/admin/categories", icon: FolderTree },
  { title: "কাস্টমার", url: "/admin/customers", icon: Users },
];

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
  onSignOut: () => void;
}

const AdminSidebar = ({ open, onToggle, onSignOut }: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground transition-transform duration-300 flex flex-col",
          "w-64 lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
          <div>
            <h1 className="font-brand text-xl text-sidebar-primary">Sapahar Mango</h1>
            <p className="text-xs text-sidebar-foreground/70">অ্যাডমিন প্যানেল</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url ||
              (item.url !== "/admin" && location.pathname.startsWith(item.url));
            return (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            লগআউট
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
