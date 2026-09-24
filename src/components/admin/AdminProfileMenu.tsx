import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  Package,
  ShoppingCart,
  BarChart3,
  Globe,
  RefreshCw,
  LogOut,
  Shield,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminProfileMenuProps {
  userEmail?: string;
  onSignOut: () => void;
}

export const AdminProfileMenu = ({ userEmail, onSignOut }: AdminProfileMenuProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast({
        title: "ডাটা রিফ্রেশ সফল",
        description: "সমস্ত ক্যাশ সফলভাবে আপডেট করা হয়েছে।",
      });
    } catch {
      toast({
        title: "রিফ্রেশ ব্যর্থ",
        description: "দয়া করে পুনরায় চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-xl hover:bg-muted/80 transition-all border border-transparent hover:border-border/50"
          aria-label="অ্যাডমিন প্রোফাইল মেনু"
        >
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-primary/20 shadow-xs">
              {initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-card" />
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-foreground truncate max-w-[120px] leading-tight">
              {userEmail ? userEmail.split("@")[0] : "Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">সুপার অ্যাডমিন</p>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 p-2 rounded-2xl shadow-2xl border border-border/60 bg-card z-50"
      >
        {/* Header */}
        <div className="px-3 py-2.5 bg-muted/40 rounded-xl mb-1 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/30 shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate" title={userEmail}>
              {userEmail || "Admin"}
            </p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20 font-semibold mt-0.5">
              সুপার অ্যাডমিন
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Quick Menu */}
        <DropdownMenuItem
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>সাইট সেটিংস</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>পণ্য ও স্টক পরিচালনা</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span>অর্ডার ট্র্যাকিং</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/admin/reports")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span>ব্যবসায়িক রিপোর্ট</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem asChild>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>ওয়েবসাইট দেখুন</span>
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleRefreshCache}
          disabled={refreshing}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin text-primary")} />
          <span>ডাটা রিফ্রেশ করুন</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={onSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>লগআউট</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminProfileMenu;
