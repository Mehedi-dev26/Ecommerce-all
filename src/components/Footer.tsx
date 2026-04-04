import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-10 sm:py-12">
      <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <h3 className="font-brand mb-3 text-2xl font-bold text-secondary sm:text-3xl">Mawra</h3>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            বাংলাদেশের ঐতিহ্যবাহী খাঁটি খাদ্যপণ্য আপনার দোরগোড়ায়।
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-secondary uppercase tracking-wider">দ্রুত লিংক</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-primary-foreground/80 hover:text-secondary transition-colors">হোম</Link></li>
            <li><Link to="/products" className="text-primary-foreground/80 hover:text-secondary transition-colors">পণ্যসমূহ</Link></li>
            <li><Link to="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/contact" className="text-primary-foreground/80 hover:text-secondary transition-colors">যোগাযোগ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-secondary uppercase tracking-wider">ক্যাটাগরি</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products?category=Pickles" className="text-primary-foreground/80 hover:text-secondary transition-colors">আচার</Link></li>
            <li><Link to="/products?category=Fruits" className="text-primary-foreground/80 hover:text-secondary transition-colors">ফল</Link></li>
            <li><Link to="/products?category=Oils" className="text-primary-foreground/80 hover:text-secondary transition-colors">তেল</Link></li>
            <li><Link to="/products?category=Honey & Dates" className="text-primary-foreground/80 hover:text-secondary transition-colors">মধু ও খেজুর</Link></li>
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="mb-3 text-sm font-semibold text-secondary uppercase tracking-wider">যোগাযোগ</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-primary-foreground/80"><Phone className="h-4 w-4 shrink-0" /> +880 1798-268989</li>
            <li className="flex items-center gap-2 text-primary-foreground/80"><Mail className="h-4 w-4 shrink-0" /> info@mawra.com</li>
            <li className="flex items-center gap-2 text-primary-foreground/80"><MapPin className="h-4 w-4 shrink-0" /> ঢাকা, বাংলাদেশ</li>
            <li>
              <a href="#" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors">
                <Facebook className="h-4 w-4 shrink-0" /> Facebook Page
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/50 sm:text-sm">
        © {new Date().getFullYear()} MAWRA। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  </footer>
);

export default Footer;
