import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";
import AdminNotificationPopover from "@/components/admin/AdminNotificationPopover";
import AdminProfileMenu from "@/components/admin/AdminProfileMenu";
import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import PageLoader from "@/components/PageLoader";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "ড্যাশবোর্ড", subtitle: "আপনার ব্যবসার সারসংক্ষেপ" },
  "/admin/products": { title: "প্রোডাক্ট", subtitle: "পণ্য পরিচালনা ও স্টক ম্যানেজমেন্ট" },
  "/admin/orders": { title: "অর্ডার", subtitle: "অর্ডার ট্র্যাকিং ও ম্যানেজমেন্ট" },
  "/admin/categories": { title: "ক্যাটাগরি", subtitle: "পণ্যের শ্রেণীবিভাগ পরিচালনা" },
  "/admin/banners": { title: "ব্যানার", subtitle: "হোমপেজ স্লাইডার ব্যানার পরিচালনা" },
  "/admin/customers": { title: "কাস্টমার", subtitle: "গ্রাহক তথ্য ও বিশ্লেষণ" },
  "/admin/payments": { title: "পেমেন্ট", subtitle: "পেমেন্ট ট্র্যাকিং ও ম্যানেজমেন্ট" },
  "/admin/delivery": { title: "ডেলিভারি", subtitle: "ডেলিভারি ট্র্যাকিং ও শিপমেন্ট" },
  "/admin/courier-charges": { title: "কুরিয়ার চার্জ", subtitle: "এলাকা ভিত্তিক কুরিয়ার চার্জ" },
  "/admin/vendors": { title: "দোকান নিবন্ধন", subtitle: "বিক্রেতা আবেদন রিভিউ ও অনুমোদন" },
  "/admin/vendor-management": { title: "ভেন্ডর ম্যানেজমেন্ট", subtitle: "অনুমোদিত বিক্রেতা ও কমিশন" },
  "/admin/vendor-withdrawals": { title: "ভেন্ডর উত্তোলন", subtitle: "ভেন্ডর আয় ও পেআউট অনুরোধ" },
  "/admin/vendor-support": { title: "লাইভ সাপোর্ট", subtitle: "ভেন্ডরদের সাথে রিয়েল-টাইম চ্যাট ও AI সাজেশন" },
  "/admin/reviews": { title: "গ্রাহক রিভিউ", subtitle: "কাস্টমার রিভিউ ও রেটিং পরিচালনা" },
  "/admin/reports": { title: "রিপোর্ট", subtitle: "ব্যবসায়িক বিশ্লেষণ ও রিপোর্ট" },
  "/admin/settings": { title: "সেটিংস", subtitle: "সাইট কনফিগারেশন" },
};

const AdminLayout = () => {
  const { user, loading, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  const currentPage = pageTitles[location.pathname] || { title: "অ্যাডমিন", subtitle: "" };

  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast({
        title: "রিফ্রেশ সম্পন্ন",
        description: "সমস্ত ডাটা সফলভাবে রিলোড হয়েছে।",
      });
    } catch {
      // ignore
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  if (loading) {
    return <PageLoader fullScreen message="অ্যাডমিন প্যানেল লোড হচ্ছে" />;
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-muted/40">
      <AdminSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        userEmail={user.email}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar - sticky */}
        <header className="shrink-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-8 py-2.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                {currentPage.title}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">
                {currentPage.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGlobalRefresh}
                disabled={refreshing}
                title="ডাটা রিফ্রেশ করুন"
                className="hidden sm:flex text-muted-foreground hover:text-foreground rounded-xl"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin text-primary")} />
              </Button>

              <AdminNotificationPopover />

              <div className="h-6 w-px bg-border/80 mx-1 hidden sm:block" />

              <AdminProfileMenu userEmail={user.email} onSignOut={signOut} />
            </div>
          </div>
        </header>

        {/* Content - scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Footer - hidden on mobile */}
        <footer className="shrink-0 border-t border-border/50 bg-card/50 px-4 lg:px-8 py-3 hidden lg:block">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Sapahar Shop</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav />

      {/* Floating AI Assistant — admin-only */}
      <AdminAIAssistant />
    </div>
  );
};

export default AdminLayout;
