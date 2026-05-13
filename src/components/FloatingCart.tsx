import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { optimizeRemoteImage } from "@/lib/image-url";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/admin", "/vendor", "/lp", "/cart", "/checkout", "/order-success"];

const FloatingCart = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const isEmpty = totalItems === 0;

  return (
    <>
      {/* Sticky right-edge floating cart button — always visible (gharerbazar style) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isEmpty ? "কার্ট খালি" : `কার্ট দেখুন — ${totalItems}টি পণ্য, মোট ৳${totalPrice}`}
        className={cn(
          "fixed right-0 top-1/2 z-[55] -translate-y-1/2",
          "flex flex-col items-center gap-1.5 rounded-l-2xl",
          "bg-gradient-to-b from-amber-500 to-orange-600 px-2.5 py-3 text-white shadow-2xl ring-2 ring-white/40",
          "transition-all duration-200 hover:px-3 hover:scale-[1.03] active:scale-95"
        )}
      >
        <div className="relative">
          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.4} />
          <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-orange-700 shadow ring-1 ring-orange-300">
            {totalItems}
          </span>
        </div>
        <span className="text-[11px] font-bold leading-none drop-shadow sm:text-xs">
          {isEmpty ? "কার্ট" : `৳${totalPrice}`}
        </span>
      </button>

      {/* Slide-in cart drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              আপনার কার্ট
              <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                {totalItems}টি পণ্য
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {isEmpty ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">আপনার কার্ট খালি</p>
                <p className="text-xs text-muted-foreground">পণ্য যোগ করতে শপিং শুরু করুন</p>
                <Button asChild className="mt-2" onClick={() => setOpen(false)}>
                  <Link to="/products">পণ্য দেখুন</Link>
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm"
                  >
                    <Link
                      to={`/products/${item.id}`}
                      onClick={() => setOpen(false)}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border"
                    >
                      {item.image_url ? (
                        <img
                          src={optimizeRemoteImage(item.image_url)}
                          alt={item.name_bn || item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        to={`/products/${item.id}`}
                        onClick={() => setOpen(false)}
                        className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {item.name_bn || item.name}
                      </Link>
                      {item.weight && (
                        <span className="mt-0.5 text-[11px] text-muted-foreground">{item.weight}</span>
                      )}

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="কমান"
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="বাড়ান"
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-primary">৳{item.price * item.quantity}</div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="মুছুন"
                          className="rounded-md p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer with totals + CTA */}
          {!isEmpty && (
            <div className="border-t border-border bg-background p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">সাব-টোটাল</span>
                <span className="font-bold text-foreground">৳{totalPrice}</span>
              </div>
              <p className="mb-2.5 text-[11px] text-muted-foreground">
                ডেলিভারি চার্জ চেকআউট পেইজে গণনা করা হবে
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 font-bold"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/cart">কার্ট দেখুন</Link>
                </Button>
                <Button
                  asChild
                  className="h-11 bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-700"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/checkout">
                    চেকআউট
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FloatingCart;
