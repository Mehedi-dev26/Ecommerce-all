import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import brandLogo from "@/assets/brand-logo.png";

const defaults: Record<string, string> = {
  footer_phone: "+880 1779-80168",
  footer_email: "surzoshop@gmail.com",
  footer_location: "আশুরন্দ বাজার, সাপাহার, নওগাঁ",
  footer_facebook: "#",
  footer_copyright: "© {year} Surzo Shop — সেরা পণ্য, সেরা দামে। সর্বস্বত্ব সংরক্ষিত।",
};

const Footer = () => {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = { ...defaults };
          data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
          setSettings(map);
        }
      });
  }, []);

  const copyright = settings.footer_copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-accent/40 shrink-0">
                <img src={brandLogo} alt="Surzo Shop logo" className="h-full w-full object-contain" />
              </div>
              <span className="font-brand text-3xl font-bold text-accent sm:text-4xl">Surzo Shop</span>
            </div>
            <p className="text-base text-white/90 leading-relaxed">
              ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল — সেরা পণ্য সরাসরি আপনার দোরগোড়ায়।
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">দ্রুত লিংক</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/" className="text-white/90 hover:text-accent transition-colors font-medium">হোম</Link></li>
              <li><Link to="/products" className="text-white/90 hover:text-accent transition-colors font-medium">পণ্য সমূহ</Link></li>
              <li><Link to="/about" className="text-white/90 hover:text-accent transition-colors font-medium">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="text-white/90 hover:text-accent transition-colors font-medium">যোগাযোগ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">ক্যাটাগরি</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/products?category=Electronics" className="text-white/90 hover:text-accent transition-colors font-medium">ইলেকট্রনিক্স</Link></li>
              <li><Link to="/products?category=Home%20Appliances" className="text-white/90 hover:text-accent transition-colors font-medium">হোম অ্যাপ্লায়েন্স</Link></li>
              <li><Link to="/products?category=Bicycles%20%26%20Vehicles" className="text-white/90 hover:text-accent transition-colors font-medium">সাইকেল ও যানবাহন</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">যোগাযোগ</h4>
            <ul className="space-y-3 text-base">
              <li className="flex items-center gap-2 text-white/90 font-medium"><Phone className="h-5 w-5 text-accent shrink-0" /> {settings.footer_phone}</li>
              <li className="flex items-center gap-2 text-white/90 font-medium"><Mail className="h-5 w-5 text-accent shrink-0" /> {settings.footer_email}</li>
              <li className="flex items-center gap-2 text-white/90 font-medium"><MapPin className="h-5 w-5 text-accent shrink-0" /> {settings.footer_location}</li>
              <li>
                <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/90 hover:text-accent transition-colors font-medium">
                  <Facebook className="h-5 w-5 text-accent shrink-0" /> Facebook Page
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/20 pt-6 text-center text-sm text-white/70 sm:text-base font-medium">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
