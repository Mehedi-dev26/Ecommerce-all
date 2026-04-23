import { Link } from "react-router-dom";
import { ShoppingCart, Menu, Phone, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import brandLogo from "@/assets/brand-logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, profile, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "হোম" },
    { to: "/products", label: "পণ্য সমূহ" },
    { to: "/about", label: "আমাদের সম্পর্কে" },
    { to: "/contact", label: "যোগাযোগ" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-white/40 sm:h-12 sm:w-12">
            <img src={brandLogo} alt="Surzo Shop logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-brand text-3xl font-bold leading-none text-white sm:text-4xl drop-shadow-md">Surzo Shop</span>
            <span className="text-[9px] font-medium tracking-wider text-white/80 sm:text-[10px]">সেরা পণ্য, সেরা দামে</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/15 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="tel:+8801779801680" className="hidden rounded-lg bg-white/15 p-2 text-white/90 transition hover:bg-white/25 hover:text-white sm:block">
            <Phone className="h-4 w-4" />
          </a>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/15 text-white hover:bg-white/25 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground shadow-md">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth Button */}
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/15 text-white hover:bg-white/25 hover:text-white overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{profile?.full_name || user.user_metadata?.full_name || "ইউজার"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      আমার ড্যাশবোর্ড
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    লগআউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-lg bg-white/15 text-white hover:bg-white/25 hover:text-white text-xs sm:text-sm gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">লগইন</span>
                </Button>
              </Link>
            )
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/15 text-white hover:bg-white/25">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r-primary/30 bg-primary">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-white/40">
                    <img src={brandLogo} alt="Surzo Shop logo" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-brand text-2xl font-bold text-white">Surzo Shop</span>
                    <span className="text-[9px] text-white/70">সেরা পণ্য, সেরা দামে</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10">
                      আমার ড্যাশবোর্ড
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="rounded-lg px-4 py-3 text-left text-base font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                      লগআউট
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10">
                    লগইন
                  </Link>
                )}
              </nav>
              <div className="mt-6 border-t border-white/10 pt-4">
                <a href="tel:+8801779801680" className="flex items-center gap-2 px-4 text-sm text-white/70 hover:text-white">
                  <Phone className="h-4 w-4" /> +880 1779-80168
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
