import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Store, Download, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { MobileSearchOverlay } from "@/components/ProductSearch";

const MobileBottomNav = () => {
  const location = useLocation();
  const { items: cartItems } = useCart();
  const cartCount = cartItems?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);

  const hidden =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/vendor") ||
    location.pathname.startsWith("/lp/") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/order-success");
  if (hidden) return null;

  return (
    <>
      <MobileSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div
        className="md:hidden"
        style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
        aria-hidden="true"
      />

      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Mobile bottom navigation">
        <div
          className="relative mx-auto border-t border-amber-200/70 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-5 items-end">
            {/* Home */}
            <li>
              <NavLink
                to="/"
                end
                aria-label="হোম"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-foreground/70 hover:text-primary",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Home className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
                    <span className={cn(isActive && "font-bold")}>হোম</span>
                  </>
                )}
              </NavLink>
            </li>

            {/* Shop */}
            <li>
              <NavLink
                to="/products"
                aria-label="শপ"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-foreground/70 hover:text-primary",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Store className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
                    <span className={cn(isActive && "font-bold")}>শপ</span>
                  </>
                )}
              </NavLink>
            </li>

            {/* App (highlighted center) */}
            <li className="flex justify-center">
              <NavLink
                to="/install"
                aria-label="অ্যাপ"
                className="relative -mt-7 flex flex-col items-center gap-1 transition-transform active:scale-95"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-4 ring-white",
                        isActive && "from-amber-500 to-orange-700",
                      )}
                    >
                      <Download className="h-6 w-6" strokeWidth={2.5} />
                    </span>
                    <span className={cn("text-[10px] font-bold", isActive ? "text-orange-700" : "text-amber-800")}>
                      অ্যাপ
                    </span>
                  </>
                )}
              </NavLink>
            </li>

            {/* Search (replaces Cart per request — Cart still accessible from header) */}
            <li>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="সার্চ"
                className="flex w-full flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 text-[11px] font-medium text-foreground/70 transition-colors hover:text-primary"
              >
                <span className="relative">
                  <Search className="h-[22px] w-[22px]" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-white shadow">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                <span>সার্চ</span>
              </button>
            </li>

            {/* Account */}
            <li>
              <NavLink
                to="/dashboard"
                aria-label="অ্যাকাউন্ট"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-foreground/70 hover:text-primary",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <User className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")} />
                    <span className={cn(isActive && "font-bold")}>অ্যাকাউন্ট</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
