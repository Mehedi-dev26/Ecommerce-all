import { Link } from "react-router-dom";
import { ShoppingCart, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import mangoLogo from "@/assets/mango-logo.png";

const Navbar = () => {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "হোম" },
    { to: "/products", label: "আম সমূহ" },
    { to: "/about", label: "আমাদের সম্পর্কে" },
    { to: "/contact", label: "যোগাযোগ" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={mangoLogo}
              alt="সাপাহার Mango Logo"
              className="h-10 w-10 rounded-full object-contain bg-white ring-[3px] ring-white/80 ring-offset-2 ring-offset-primary sm:h-11 sm:w-11"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-brand text-2xl font-bold leading-none text-white sm:text-3xl drop-shadow-md">সাপাহার Mango</span>
            <span className="text-[9px] font-medium tracking-wider text-white/80 sm:text-[10px]">সাপাহারের দেশি আম</span>
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
          <a href="tel:+8801798268989" className="hidden rounded-lg bg-white/15 p-2 text-white/90 transition hover:bg-white/25 hover:text-white sm:block">
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

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/15 text-white hover:bg-white/25">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r-primary/30 bg-primary">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <img src={mangoLogo} alt="সাপাহার Mango" className="h-8 w-8 rounded-full object-contain bg-white ring-2 ring-white/80" />
                  <div className="flex flex-col">
                    <span className="font-brand text-xl text-white">সাপাহার Mango</span>
                    <span className="text-[9px] text-white/70">সাপাহারের দেশি আম</span>
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
              </nav>
              <div className="mt-6 border-t border-white/10 pt-4">
                <a href="tel:+8801798268989" className="flex items-center gap-2 px-4 text-sm text-white/70 hover:text-white">
                  <Phone className="h-4 w-4" /> +880 1798-268989
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
