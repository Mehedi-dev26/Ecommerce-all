import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const { settings, logoUrl } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Shop";
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
    { name: "Facebook", icon: Facebook, href: settings.footer_facebook, label: "Facebook", color: "#1877F2", hoverBg: "hover:bg-[#1877F2]" },
    { name: "Instagram", icon: Instagram, href: settings.footer_instagram, label: "Instagram", color: "#E1306C", hoverBg: "hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]" },
    { name: "YouTube", icon: Youtube, href: settings.footer_youtube, label: "YouTube", color: "#FF0000", hoverBg: "hover:bg-[#FF0000]" },
  ];

  return (
    <footer className="relative border-t border-border/60 bg-gradient-to-b from-background via-muted/40 to-background text-foreground">
      {/* Subtle decorative glass blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Top trust strip */}
      <div className="relative border-b border-border/60 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto grid grid-cols-2 gap-3 px-4 py-4 text-center sm:grid-cols-4 sm:gap-6">
          {[
            { t: "১০০% খাঁটি", s: "সরাসরি বাগান থেকে" },
            { t: "দ্রুত ডেলিভারি", s: "সারা বাংলাদেশে" },
            { t: "সহজ পেমেন্ট", s: "COD, bKash, Nagad" },
            { t: "২৪/৭ সাপোর্ট", s: "যেকোনো সাহায্যে" },
          ].map((item) => (
            <div key={item.t} className="flex flex-col items-center">
              <span className="text-sm font-bold text-foreground sm:text-base">{item.t}</span>
              <span className="text-[11px] text-muted-foreground sm:text-xs">{item.s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border shrink-0">
                <img src={logoUrl} alt={`${brandName} logo`} width="56" height="56" loading="lazy" decoding="async" className="h-full w-full object-contain" />
              </div>
              <span className="font-brand text-3xl font-bold text-primary sm:text-4xl">{brandName}</span>
            </div>
            {aboutText && <p className="text-sm leading-relaxed text-muted-foreground">{aboutText}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/70 text-foreground/70 backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                  >
                    <s.icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>

              <div className="relative inline-flex overflow-hidden rounded-full border border-border bg-white/70 backdrop-blur-md px-3 py-1.5 shadow-sm">
                <p className="relative text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                  Created by{" "}
                  <a
                    href="https://upnexit.pro.bd/"
                    target="_blank"
                    rel="noopener noreferrer author"
                    className="font-extrabold text-primary hover:underline"
                  >
                    Upnex IT
                  </a>
                  <span className="mx-1 text-muted-foreground/60">/</span>
                  <a
                    href="https://upnexit.pro.bd/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold text-primary hover:underline"
                  >
                    Mehedi
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">দ্রুত লিংক</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-muted-foreground transition-colors hover:text-primary">হোম</Link></li>
              <li><Link to="/products" className="text-muted-foreground transition-colors hover:text-primary">পণ্য সমূহ</Link></li>
              <li><Link to="/about" className="text-muted-foreground transition-colors hover:text-primary">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="text-muted-foreground transition-colors hover:text-primary">যোগাযোগ</Link></li>
              <li><Link to="/privacy-policy" className="text-muted-foreground transition-colors hover:text-primary">গোপনীয়তা নীতি</Link></li>
              <li><Link to="/terms-conditions" className="text-muted-foreground transition-colors hover:text-primary">শর্তাবলী</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">ক্যাটাগরি</h4>
            <ul className="space-y-2.5 text-sm">
              {(categories ?? []).map((c) => (
                <li key={c.name}>
                  <Link
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {c.name_bn || c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:${settings.footer_phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Phone className="h-4 w-4 text-primary shrink-0" /> {settings.footer_phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.footer_email}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Mail className="h-4 w-4 text-primary shrink-0" /> {settings.footer_email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary shrink-0" /> {settings.footer_location}</li>
              <li>
                <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Facebook className="h-4 w-4 text-primary shrink-0" /> Facebook Page
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment / shipping methods strip */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-white/60 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">পেমেন্ট</span>
            <div className="flex items-center gap-2">
              {["COD", "bKash", "Nagad"].map((m) => (
                <span key={m} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground">{m}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">কুরিয়ার</span>
            <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground">Pathao</span>
            <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground">Steadfast</span>
          </div>
        </div>

        <div className="mt-6 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground sm:text-sm">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
