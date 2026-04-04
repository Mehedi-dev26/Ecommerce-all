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
    { to: "/products", label: "পণ্যসমূহ" },
    { to: "/about", label: "আমাদের সম্পর্কে" },
    { to: "/contact", label: "যোগাযোগ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={mawraLogo} alt="MAWRA Logo" className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10" />
          <span className="font-brand text-2xl font-bold text-primary-foreground sm:text-3xl">Mawra</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-primary-foreground/90 transition-colors hover:text-secondary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="tel:+8801798268989" className="hidden text-primary-foreground/90 hover:text-secondary sm:block">
            <Phone className="h-5 w-5" />
          </a>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary/80 hover:text-secondary">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary/80">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-primary">
              <SheetHeader>
                <SheetTitle className="font-brand text-2xl text-primary-foreground">Mawra</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/80 hover:text-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t border-primary-foreground/20 pt-4">
                <a href="tel:+8801798268989" className="flex items-center gap-2 px-4 text-sm text-primary-foreground/80">
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
