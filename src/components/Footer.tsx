import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-4 text-lg font-bold text-secondary">MAWRA</h3>
          <p className="text-sm text-primary-foreground/80">
            বাংলাদেশের ঐতিহ্যবাহী খাঁটি খাদ্যপণ্য আপনার দোরগোড়ায়। আমরা নিশ্চিত করি সর্বোচ্চ মানের পণ্য।
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-secondary">দ্রুত লিংক</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-primary-foreground/80 hover:text-secondary">হোম</Link></li>
            <li><Link to="/products" className="text-primary-foreground/80 hover:text-secondary">পণ্যসমূহ</Link></li>
            <li><Link to="/about" className="text-primary-foreground/80 hover:text-secondary">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/contact" className="text-primary-foreground/80 hover:text-secondary">যোগাযোগ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-secondary">ক্যাটাগরি</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products?category=Pickles" className="text-primary-foreground/80 hover:text-secondary">আচার</Link></li>
            <li><Link to="/products?category=Fruits" className="text-primary-foreground/80 hover:text-secondary">ফল</Link></li>
            <li><Link to="/products?category=Oils" className="text-primary-foreground/80 hover:text-secondary">তেল</Link></li>
            <li><Link to="/products?category=Honey & Dates" className="text-primary-foreground/80 hover:text-secondary">মধু ও খেজুর</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-secondary">যোগাযোগ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-primary-foreground/80"><Phone className="h-4 w-4" /> +880 1XXX-XXXXXX</li>
            <li className="flex items-center gap-2 text-primary-foreground/80"><Mail className="h-4 w-4" /> info@mawra.com</li>
            <li className="flex items-center gap-2 text-primary-foreground/80"><MapPin className="h-4 w-4" /> ঢাকা, বাংলাদেশ</li>
            <li>
              <a href="#" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary">
                <Facebook className="h-4 w-4" /> Facebook Page
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/60">
        © {new Date().getFullYear()} MAWRA। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  </footer>
);

export default Footer;
