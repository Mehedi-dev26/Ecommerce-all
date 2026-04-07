import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu, Bell, Search, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "ড্যাশবোর্ড", subtitle: "আপনার ব্যবসার সারসংক্ষেপ" },
  "/admin/products": { title: "প্রোডাক্ট", subtitle: "পণ্য পরিচালনা ও স্টক ম্যানেজমেন্ট" },
  "/admin/orders": { title: "অর্ডার", subtitle: "অর্ডার ট্র্যাকিং ও ম্যানেজমেন্ট" },
  "/admin/categories": { title: "ক্যাটাগরি", subtitle: "পণ্যের শ্রেণীবিভাগ পরিচালনা" },
  "/admin/customers": { title: "কাস্টমার", subtitle: "গ্রাহক তথ্য ও বিশ্লেষণ" },
  "/admin/reports": { title: "রিপোর্ট", subtitle: "ব্যবসায়িক বিশ্লেষণ ও রিপোর্ট" },
  "/admin/settings": { title: "সেটিংস", subtitle: "সাইট কনফিগারেশন" },
};

const AdminLayout = () => {
  const { user, loading, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || { title: "অ্যাডমিন", subtitle: "" };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-muted/40">
      <AdminSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        userEmail={user.email}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {currentPage.title}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {currentPage.subtitle}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="relative hidden md:block">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Bell className="h-4 w-4" />
                </Button>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              <div className="hidden md:flex items-center gap-2 pl-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/50 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Sapahar Mango</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
