import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.png";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground">
    <div className="container mx-auto px-4 py-10 sm:py-14">
      <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={mangoLogo} alt="সাপাহার Mango" className="h-12 w-12 rounded-full object-contain bg-white ring-2 ring-primary" />
            <span className="font-brand text-2xl font-bold text-primary sm:text-3xl">সাপাহার Mango</span>
          </div>
          <p className="text-base text-white/90 leading-relaxed">
            নওগাঁর সাপাহারের খাঁটি দেশি আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়।
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-base font-bold text-primary uppercase tracking-wider">দ্রুত লিংক</h4>
          <ul className="space-y-3 text-base">
            <li><Link to="/" className="text-white/90 hover:text-primary transition-colors font-medium">হোম</Link></li>
            <li><Link to="/products" className="text-white/90 hover:text-primary transition-colors font-medium">আম সমূহ</Link></li>
            <li><Link to="/about" className="text-white/90 hover:text-primary transition-colors font-medium">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/contact" className="text-white/90 hover:text-primary transition-colors font-medium">যোগাযোগ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-base font-bold text-primary uppercase tracking-wider">আমের জাত</h4>
          <ul className="space-y-3 text-base">
            <li className="text-white/90 font-medium">🥭 ল্যাংড়া</li>
            <li className="text-white/90 font-medium">🥭 হিমসাগর</li>
            <li className="text-white/90 font-medium">🥭 গোপালভোগ</li>
            <li className="text-white/90 font-medium">🥭 আম্রপালি</li>
            <li className="text-white/90 font-medium">🥭 ফজলি</li>
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="mb-4 text-base font-bold text-primary uppercase tracking-wider">যোগাযোগ</h4>
          <ul className="space-y-3 text-base">
            <li className="flex items-center gap-2 text-white/90 font-medium"><Phone className="h-5 w-5 text-primary shrink-0" /> +880 1798-268989</li>
            <li className="flex items-center gap-2 text-white/90 font-medium"><Mail className="h-5 w-5 text-primary shrink-0" /> info@sapaharmango.com</li>
            <li className="flex items-center gap-2 text-white/90 font-medium"><MapPin className="h-5 w-5 text-primary shrink-0" /> সাপাহার, নওগাঁ, বাংলাদেশ</li>
            <li>
              <a href="#" className="flex items-center gap-2 text-white/90 hover:text-primary transition-colors font-medium">
                <Facebook className="h-5 w-5 text-primary shrink-0" /> Facebook Page
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-white/20 pt-6 text-center text-sm text-white/70 sm:text-base font-medium">
        © {new Date().getFullYear()} সাপাহার Mango — সাপাহারের দেশি আম। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  </footer>
);

export default Footer;
