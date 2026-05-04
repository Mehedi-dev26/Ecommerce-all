import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import brandLogoFallback from "@/assets/brand-logo.png";

export const SITE_DEFAULTS: Record<string, string> = {
  brand_name: "Sapahar Mango Shop",
  brand_tagline: "স্বল্প মূল্যে বাজারের সেরা আম",
  brand_logo_url: "",
  header_phone: "+8801720565997",
  company_name: "Sapahar Mango Shop",
  company_email: "sapaharmangostore@gmail.com",
  company_phone: "+8801720565997",
  footer_phone: "01720565997",
  footer_email: "sapaharmangostore@gmail.com",
  footer_location: "সাপাহার বাজার, সাপাহার, নওগাঁ",
  footer_about: "Sapahar Mango Shop — সাপাহারের সেরা ও সুস্বাদু আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়। ১০০% খাঁটি, রাসায়নিকমুক্ত।",
  footer_facebook: "#",
  footer_instagram: "#",
  footer_youtube: "#",
  footer_copyright: "© {year} Sapahar Mango Shop — সাপাহারের খাঁটি আমের নির্ভরযোগ্য ঠিকানা। সর্বস্বত্ব সংরক্ষিত।",
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