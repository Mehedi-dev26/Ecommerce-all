import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ShoppingCart,
  Store,
  Star,
  Banknote,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "order" | "vendor" | "review" | "withdrawal" | "stock";
  title: string;
  subtitle: string;
  url: string;
  time?: string;
  badge?: string;
  badgeCls?: string;
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "কিছুক্ষণ আগে";
    if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
    return `${Math.floor(diff / 86400)} দিন আগে`;
  } catch {
    return "";
  }
};

export const AdminNotificationPopover = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-header-notifications"],
    queryFn: async () => {
      const items: NotificationItem[] = [];

      // 1. Pending orders
      try {
        const { data: pendingOrders } = await supabase
          .from("orders" as any)
          .select("id, order_number, customer_name, total, created_at, status")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        if (pendingOrders && pendingOrders.length > 0) {
          pendingOrders.forEach((o: any) => {
            items.push({
              id: `order-${o.id}`,
              type: "order",
              title: `নতুন অর্ডার #${o.order_number || o.id.slice(0, 6)}`,
              subtitle: `${o.customer_name || "গ্রাহক"} — ৳${Number(o.total || 0).toLocaleString("bn-BD")}`,
              url: "/admin/orders",
              time: formatRelativeTime(o.created_at),
              badge: "অর্ডার",
              badgeCls: "bg-blue-500/10 text-blue-600 border-blue-200",
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending orders for notifications", err);
      }

      // 2. Pending vendor requests
      try {
        const { data: pendingVendors } = await supabase
          .from("vendors" as any)
          .select("id, shop_name, shop_name_bn, owner_name, created_at, status")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(4);

        if (pendingVendors && pendingVendors.length > 0) {
          pendingVendors.forEach((v: any) => {
            items.push({
              id: `vendor-${v.id}`,
              type: "vendor",
              title: "নতুন দোকান নিবন্ধন আবেদন",
              subtitle: `${v.shop_name_bn || v.shop_name || "দোকান"} (${v.owner_name || ""})`,
              url: "/admin/vendors",
              time: formatRelativeTime(v.created_at),
              badge: "ভেন্ডর",
              badgeCls: "bg-amber-500/10 text-amber-600 border-amber-200",
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending vendors", err);
      }

      // 3. Pending customer reviews
      try {
        const { data: pendingReviews } = await supabase
          .from("reviews" as any)
          .select("id, customer_name, rating, created_at, status")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(4);

        if (pendingReviews && pendingReviews.length > 0) {
          pendingReviews.forEach((r: any) => {
            items.push({
              id: `review-${r.id}`,
              type: "review",
              title: "নতুন গ্রাহক রিভিউ অনুমোদন",
              subtitle: `${r.customer_name || "ক্রেতা"} (${r.rating || 5}★)`,
              url: "/admin/reviews",
              time: formatRelativeTime(r.created_at),
              badge: "রিভিউ",
              badgeCls: "bg-purple-500/10 text-purple-600 border-purple-200",
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending reviews", err);
      }

      // 4. Pending vendor payouts
      try {
        const { data: pendingPayouts } = await supabase
          .from("vendor_payouts" as any)
          .select("id, amount, requested_at, status")
          .eq("status", "pending")
          .order("requested_at", { ascending: false })
          .limit(3);

        if (pendingPayouts && pendingPayouts.length > 0) {
          pendingPayouts.forEach((p: any) => {
            items.push({
              id: `payout-${p.id}`,
              type: "withdrawal",
              title: "ভেন্ডর উত্তোলন পেআউট রিকোয়েস্ট",
              subtitle: `৳${Number(p.amount || 0).toLocaleString("bn-BD")} উত্তোলনের আবেদন`,
              url: "/admin/vendor-withdrawals",
              time: formatRelativeTime(p.requested_at),
              badge: "পেআউট",
              badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending payouts", err);
      }

      // 5. Low stock alerts
      try {
        const { data: lowStock } = await supabase
          .from("products" as any)
          .select("id, name_bn, name, stock")
          .lte("stock", 5)
          .order("stock", { ascending: true })
          .limit(3);

        if (lowStock && lowStock.length > 0) {
          lowStock.forEach((p: any) => {
            items.push({
              id: `stock-${p.id}`,
              type: "stock",
              title: "স্টক শেষ পর্যায়ে সতর্কতা!",
              subtitle: `${p.name_bn || p.name} — অবশিষ্ট: ${p.stock} টি`,
              url: "/admin/products",
              badge: "স্টক অ্যালার্ট",
              badgeCls: "bg-rose-500/10 text-rose-600 border-rose-200",
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch low stock products", err);
      }

      return items;
    },
    refetchInterval: 30000, // auto poll every 30 seconds
  });

  const notifications = data || [];
  const totalCount = notifications.length;

  const handleItemClick = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case "vendor":
        return <Store className="h-4 w-4 text-amber-600" />;
      case "review":
        return <Star className="h-4 w-4 text-purple-600" />;
      case "withdrawal":
        return <Banknote className="h-4 w-4 text-emerald-600" />;
      case "stock":
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors"
          title="নোটিফিকেশন সেন্টার"
          aria-label="নোটিফিকেশন"
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 shadow-2xl rounded-2xl border border-border/60 bg-card overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              নোটিফিকেশন ও অ্যালার্ট
            </span>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-full font-bold">
                {totalCount} টি পেন্ডিং
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          </Button>
        </div>

        {/* Content list */}
        <div className="max-h-[360px] overflow-y-auto scrollbar-none divide-y divide-border/40">
          {isLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
              নোটিফিকেশন লোড হচ্ছে...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">সবকিছু আপ-টু-ডেট!</p>
              <p className="text-xs text-muted-foreground mt-1">
                বর্তমানে কোনো অপেক্ষমাণ অর্ডার বা পেন্ডিং আবেদন নেই।
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.url)}
                className="w-full text-left p-3.5 hover:bg-muted/60 transition-colors flex items-start gap-3 group"
              >
                <div className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    {item.badge && (
                      <span className={cn("text-[9px] px-1.5 py-0.2 rounded-md font-semibold border shrink-0", item.badgeCls)}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.subtitle}
                  </p>
                  {item.time && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.time}</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-muted/20 border-t border-border/50 grid grid-cols-2 gap-2 text-center text-xs">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 rounded-xl font-medium"
            onClick={() => {
              setOpen(false);
              navigate("/admin/orders");
            }}
          >
            অর্ডার লিস্ট
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 rounded-xl font-medium"
            onClick={() => {
              setOpen(false);
              navigate("/admin/vendors");
            }}
          >
            দোকান আবেদন
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationPopover;
