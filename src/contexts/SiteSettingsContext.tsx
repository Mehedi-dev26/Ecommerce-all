import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import brandLogoFallback from "@/assets/brand-logo.png";

const FALLBACK_LOGO_URL = "https://jrbximpqznskggzlrzpu.supabase.co/storage/v1/object/public/product-images/site/logo-1777922089512.png";

export const SITE_DEFAULTS: Record<string, string> = {
  brand_name: "Sapahar Shop",
  brand_tagline: "স্বল্প মূল্যে বাজারের সেরা আম",
  brand_logo_url: FALLBACK_LOGO_URL,
  header_phone: "+8801720565997",
  company_name: "Sapahar Shop",
  company_email: "sapaharmangostore@gmail.com",
  company_phone: "+8801720565997",
  footer_phone: "01720565997",
  footer_email: "sapaharmangostore@gmail.com",
  footer_location: "সাপাহার বাজার, সাপাহার, নওগাঁ",
  footer_about: "Sapahar Shop — সাপাহারের সেরা ও সুস্বাদু আম সরাসরি বাগান থেকে আপনার দোরগোড়ায়। ১০০% খাঁটি, রাসায়নিকমুক্ত।",
  footer_facebook: "#",
  footer_instagram: "#",
  footer_youtube: "#",
  footer_copyright: "© {year} Sapahar Shop — সাপাহারের খাঁটি আমের নির্ভরযোগ্য ঠিকানা। সর্বস্বত্ব সংরক্ষিত।",
};

const CACHE_KEY = "sapahar:site_settings:v3";
const LEGACY_CACHE_KEYS = [
  "surzo:site_settings",
  "surzoshop:site_settings",
  "site_settings",
  "sapahar:site_settings:v1",
  "sapahar:site_settings:v2",
];

const hasLegacyBranding = (data: Record<string, string>) => {
  const values = [
    data.brand_name,
    data.brand_tagline,
    data.company_name,
    data.footer_about,
    data.brand_logo_url,
  ]
    .filter(Boolean)
    .join(" ");

  return /surzo/i.test(values);
};

const readCache = (): Record<string, string> | null => {
  if (typeof window === "undefined") return null;
  try {
    // Purge any old/stale cache entries from previous brand versions
    LEGACY_CACHE_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const cached = parsed && typeof parsed === "object" ? (parsed.data ?? parsed) : null;
    if (!cached || typeof cached !== "object") return null;
    const merged = { ...SITE_DEFAULTS, ...cached } as Record<string, string>;
    if (hasLegacyBranding(merged)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return merged;
  } catch {
    return null;
  }
};

const writeCache = (data: Record<string, string>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* quota exceeded — ignore */
  }
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
  // Hydrate instantly from localStorage cache so logo + brand name appear
  // on the very first paint (no flicker of stale defaults). Background
  // refresh below will update if anything has changed.
  const [settings, setSettings] = useState<Record<string, string>>(() => ({
    ...SITE_DEFAULTS,
    ...(readCache() ?? {}),
  }));

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map = { ...SITE_DEFAULTS };
      data.forEach((r: { key: string; value: string }) => {
        if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
      });
      setSettings(map);
      writeCache(map);
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