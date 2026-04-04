import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone } from "lucide-react";
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
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={mawraLogo} alt="MAWRA Logo" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-xl font-bold text-primary-foreground">MAWRA</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-primary-foreground/90 transition-colors hover:text-secondary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="tel:+8801XXXXXXXXX" className="hidden text-primary-foreground/90 hover:text-secondary sm:block">
            <Phone className="h-5 w-5" />
          </a>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-secondary">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary">
              <SheetHeader>
                <SheetTitle className="text-primary-foreground">MAWRA</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-4 py-2 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/80 hover:text-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
