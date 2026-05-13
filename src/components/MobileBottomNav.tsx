import { NavLink, useLocation } from "react-router-dom";
import { Home, Store, Download, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

const items = [
  { to: "/", label: "হোম", icon: Home, end: true },
  { to: "/products", label: "শপ", icon: Store },
  { to: "/install", label: "অ্যাপ", icon: Download, highlight: true },
  { to: "/cart", label: "কার্ট", icon: ShoppingCart, badge: "cart" as const },
  { to: "/dashboard", label: "অ্যাকাউন্ট", icon: User },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { items: cartItems } = useCart();
  const cartCount = cartItems?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) ?? 0;

  // Hide on admin / vendor / landing-page / checkout fullscreen routes
  const hidden =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/vendor") ||
    location.pathname.startsWith("/lp/") ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/order-success");
  if (hidden) return null;

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar on mobile */}
      <div
        className="md:hidden"
        style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
        aria-hidden="true"
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        aria-label="Mobile bottom navigation"
      >
        <div
          className="relative mx-auto border-t border-amber-200/70 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-5 items-end">
            {items.map((it) => {
              const Icon = it.icon;
              if (it.highlight) {
                return (
                  <li key={it.to} className="flex justify-center">
                    <NavLink
                      to={it.to}
                      aria-label={it.label}
                      className={({ isActive }) =>
                        cn(
                          "relative -mt-7 flex flex-col items-center gap-1",
                          "transition-transform active:scale-95",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/40 ring-4 ring-white",
                              isActive && "from-amber-500 to-orange-700",
                            )}
                          >
                            <Icon className="h-6 w-6" strokeWidth={2.5} />
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold",
                              isActive ? "text-orange-700" : "text-amber-800",
                            )}
                          >
                            {it.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              }
              return (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    aria-label={it.label}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center justify-center gap-0.5 px-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                        isActive ? "text-primary" : "text-foreground/70 hover:text-primary",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative">
                          <Icon
                            className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.5]")}
                          />
                          {it.badge === "cart" && cartCount > 0 && (
                            <span className="absolute -right-2 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-white shadow">
                              {cartCount > 99 ? "99+" : cartCount}
                            </span>
                          )}
                        </span>
                        <span className={cn(isActive && "font-bold")}>{it.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
