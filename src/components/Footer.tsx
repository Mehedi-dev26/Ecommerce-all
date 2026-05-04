import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const { settings, logoUrl } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Mango Shop";
  const aboutText = settings.footer_about || "";

  const { data: categories } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("name, name_bn")
        .order("sort_order")
        .limit(6);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const copyright = settings.footer_copyright.replace("{year}", String(new Date().getFullYear()));

  const socials = [
    { name: "Facebook", icon: Facebook, href: settings.footer_facebook, label: "Facebook" },
    { name: "Instagram", icon: Instagram, href: settings.footer_instagram, label: "Instagram" },
    { name: "YouTube", icon: Youtube, href: settings.footer_youtube, label: "YouTube" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white ring-2 ring-accent/40 shrink-0">
                <img src={logoUrl} alt={`${brandName} logo`} width="56" height="56" loading="lazy" decoding="async" className="h-full w-full object-contain" />
              </div>
              <span className="font-brand text-3xl font-bold text-accent sm:text-4xl">{brandName}</span>
            </div>
            {aboutText && <p className="text-base text-white/90 leading-relaxed">{aboutText}</p>}

            {/* Social buttons */}
            <div className="mt-5 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-accent hover:text-secondary hover:ring-accent"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Credits */}
            <p className="mt-4 text-sm text-white/80 font-medium">
              Created by{" "}
              <a
                href="https://upnexit.pro.bd/"
                target="_blank"
                rel="noopener noreferrer author"
                className="text-accent hover:underline font-semibold"
              >
                Upnex IT
              </a>
              {" / "}
              সহযোগিতায়{" "}
              <a
                href="https://upnexit.pro.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-semibold"
              >
                Mehedi
              </a>
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">দ্রুত লিংক</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/" className="text-white/90 hover:text-accent transition-colors font-medium">হোম</Link></li>
              <li><Link to="/products" className="text-white/90 hover:text-accent transition-colors font-medium">পণ্য সমূহ</Link></li>
              <li><Link to="/about" className="text-white/90 hover:text-accent transition-colors font-medium">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="text-white/90 hover:text-accent transition-colors font-medium">যোগাযোগ</Link></li>
              <li><Link to="/privacy-policy" className="text-white/90 hover:text-accent transition-colors font-medium">গোপনীয়তা নীতি</Link></li>
              <li><Link to="/terms-conditions" className="text-white/90 hover:text-accent transition-colors font-medium">শর্তাবলী</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">ক্যাটাগরি</h4>
            <ul className="space-y-3 text-base">
              {(categories ?? []).map((c) => (
                <li key={c.name}>
                  <Link
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    className="text-white/90 hover:text-accent transition-colors font-medium"
                  >
                    {c.name_bn || c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-4 text-base font-bold text-accent uppercase tracking-wider">যোগাযোগ</h4>
            <ul className="space-y-3 text-base">
              <li>
                <a href={`tel:${settings.footer_phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-white/90 hover:text-accent transition-colors font-medium">
                  <Phone className="h-5 w-5 text-accent shrink-0" /> {settings.footer_phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.footer_email}`} className="flex items-center gap-2 text-white/90 hover:text-accent transition-colors font-medium">
                  <Mail className="h-5 w-5 text-accent shrink-0" /> {settings.footer_email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/90 font-medium"><MapPin className="h-5 w-5 text-accent shrink-0" /> {settings.footer_location}</li>
              <li>
                <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/90 hover:text-accent transition-colors font-medium">
                  <Facebook className="h-5 w-5 text-accent shrink-0" /> Facebook Page
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/20 pt-6 text-center text-sm text-white/85 sm:text-base font-medium">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
