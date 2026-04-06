import { Link } from "react-router-dom";
import { ShoppingCart, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import mawraLogo from "@/assets/mawra-logo.jpg";

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
    <header className="sticky top-0 z-50 border-b border-secondary/20 bg-gradient-to-r from-secondary via-secondary to-secondary/90 shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={mawraLogo}
              alt="MAWRA Logo"
              className="h-10 w-10 rounded-full object-cover ring-[3px] ring-primary ring-offset-2 ring-offset-secondary sm:h-11 sm:w-11"
            />
            <div className="absolute -inset-[3px] rounded-full border-2 border-primary/30 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-brand text-2xl font-bold leading-none text-white sm:text-3xl">Mawra</span>
            <span className="text-[9px] font-medium tracking-wider text-primary/90 sm:text-[10px]">সাপাহারের দেশি আম</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="tel:+8801798268989" className="hidden rounded-lg bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-primary sm:block">
            <Phone className="h-4 w-4" />
          </a>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/10 text-white hover:bg-white/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r-secondary/30 bg-secondary">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <img src={mawraLogo} alt="MAWRA" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary" />
                  <div className="flex flex-col">
                    <span className="font-brand text-xl text-white">Mawra</span>
                    <span className="text-[9px] text-primary/80">সাপাহারের দেশি আম</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t border-white/10 pt-4">
                <a href="tel:+8801798268989" className="flex items-center gap-2 px-4 text-sm text-white/70 hover:text-primary">
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
