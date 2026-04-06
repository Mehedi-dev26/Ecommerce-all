import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground">
    <div className="container mx-auto px-4 py-10 sm:py-12">
      <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <h3 className="font-brand mb-3 text-2xl font-bold text-primary sm:text-3xl">Mawra</h3>
          <p className="text-sm text-secondary-foreground/80 leading-relaxed">
            নওগাঁর সাপাহারের খাঁটি দেশি আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়।
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-primary uppercase tracking-wider">দ্রুত লিংক</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-secondary-foreground/80 hover:text-primary transition-colors">হোম</Link></li>
            <li><Link to="/products" className="text-secondary-foreground/80 hover:text-primary transition-colors">আম সমূহ</Link></li>
            <li><Link to="/about" className="text-secondary-foreground/80 hover:text-primary transition-colors">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/contact" className="text-secondary-foreground/80 hover:text-primary transition-colors">যোগাযোগ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-primary uppercase tracking-wider">আমের জাত</h4>
          <ul className="space-y-2 text-sm">
            <li className="text-secondary-foreground/80">ল্যাংড়া</li>
            <li className="text-secondary-foreground/80">হিমসাগর</li>
            <li className="text-secondary-foreground/80">গোপালভোগ</li>
            <li className="text-secondary-foreground/80">আম্রপালি</li>
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="mb-3 text-sm font-semibold text-primary uppercase tracking-wider">যোগাযোগ</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-secondary-foreground/80"><Phone className="h-4 w-4 shrink-0" /> +880 1798-268989</li>
            <li className="flex items-center gap-2 text-secondary-foreground/80"><Mail className="h-4 w-4 shrink-0" /> info@mawra.com</li>
            <li className="flex items-center gap-2 text-secondary-foreground/80"><MapPin className="h-4 w-4 shrink-0" /> সাপাহার, নওগাঁ, বাংলাদেশ</li>
            <li>
              <a href="#" className="flex items-center gap-2 text-secondary-foreground/80 hover:text-primary transition-colors">
                <Facebook className="h-4 w-4 shrink-0" /> Facebook Page
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-secondary-foreground/20 pt-6 text-center text-xs text-secondary-foreground/50 sm:text-sm">
        © {new Date().getFullYear()} MAWRA — সাপাহারের দেশি আম। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  </footer>
);

export default Footer;
