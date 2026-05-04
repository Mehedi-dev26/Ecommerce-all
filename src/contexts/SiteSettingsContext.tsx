import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import brandLogoFallback from "@/assets/brand-logo.png";

export const SITE_DEFAULTS: Record<string, string> = {
  brand_name: "Surzo Shop",
  brand_tagline: "স্বল্প মূল্যে সেরা পণ্য",
  brand_logo_url: "",
  header_phone: "+8801779801680",
  company_name: "Surzo Shop",
  company_email: "info@example.com",
  company_phone: "+8801XXXXXXXXX",
  footer_phone: "01725391686",
  footer_email: "surzoshop@gmail.com",
  footer_location: "আশুরন্দ বাজার, সাপাহার, নওগাঁ",
  footer_about: "ইলেকট্রনিক্স, হোম অ্যাপ্লায়েন্স ও সাইকেল — সেরা পণ্য সরাসরি আপনার হাতের কাছে।",
  footer_facebook: "#",
  footer_instagram: "#",
  footer_youtube: "#",
  footer_copyright: "© {year} Surzo Shop — স্বল্প মূল্যে সেরা পণ্য। সর্বস্বত্ব সংরক্ষিত।",
};

interface SiteSettingsContextValue {
  settings: Record<string, string>;
  logoUrl: string;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: SITE_DEFAULTS,
  logoUrl: brandLogoFallback,
  refresh: async () => {},
});

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Record<string, string>>(SITE_DEFAULTS);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map = { ...SITE_DEFAULTS };
      data.forEach((r: { key: string; value: string }) => {
        if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
      });
      setSettings(map);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const logoUrl = settings.brand_logo_url?.trim() ? settings.brand_logo_url : brandLogoFallback;

  return (
    <SiteSettingsContext.Provider value={{ settings, logoUrl, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);