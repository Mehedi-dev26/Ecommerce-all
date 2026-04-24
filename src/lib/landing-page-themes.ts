// Landing page theme presets — each defines a color palette via HSL CSS variables
// Applied dynamically on the public landing page via inline style on the root container.

export interface LandingTheme {
  id: string;
  name: string;
  nameBn: string;
  preview: { primary: string; bg: string; accent: string };
  vars: {
    "--lp-primary": string;
    "--lp-primary-foreground": string;
    "--lp-bg": string;
    "--lp-fg": string;
    "--lp-accent": string;
    "--lp-accent-foreground": string;
    "--lp-muted": string;
    "--lp-muted-foreground": string;
    "--lp-card": string;
    "--lp-border": string;
    "--lp-success": string;
    "--lp-urgent": string;
  };
}

export const LANDING_THEMES: LandingTheme[] = [
  {
    id: "mango_yellow",
    name: "Mango Yellow",
    nameBn: "ম্যাঙ্গো ইয়েলো",
    preview: { primary: "#F5A623", bg: "#FFFBEB", accent: "#7B341E" },
    vars: {
      "--lp-primary": "38 92% 50%",
      "--lp-primary-foreground": "20 80% 15%",
      "--lp-bg": "48 100% 96%",
      "--lp-fg": "20 30% 15%",
      "--lp-accent": "20 80% 30%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "40 40% 92%",
      "--lp-muted-foreground": "20 15% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "40 30% 85%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 80% 55%",
    },
  },
  {
    id: "bold_red",
    name: "Bold Red",
    nameBn: "বোল্ড রেড",
    preview: { primary: "#DC2626", bg: "#FEF2F2", accent: "#7F1D1D" },
    vars: {
      "--lp-primary": "0 78% 50%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "0 60% 98%",
      "--lp-fg": "0 30% 12%",
      "--lp-accent": "0 70% 25%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "0 30% 95%",
      "--lp-muted-foreground": "0 10% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "0 30% 88%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "20 90% 50%",
    },
  },
  {
    id: "premium_dark",
    name: "Premium Dark",
    nameBn: "প্রিমিয়াম ডার্ক",
    preview: { primary: "#FCD34D", bg: "#0F172A", accent: "#FBBF24" },
    vars: {
      "--lp-primary": "45 93% 55%",
      "--lp-primary-foreground": "220 40% 10%",
      "--lp-bg": "222 47% 11%",
      "--lp-fg": "0 0% 98%",
      "--lp-accent": "45 93% 60%",
      "--lp-accent-foreground": "222 47% 11%",
      "--lp-muted": "222 30% 18%",
      "--lp-muted-foreground": "0 0% 70%",
      "--lp-card": "222 40% 15%",
      "--lp-border": "222 30% 22%",
      "--lp-success": "142 65% 50%",
      "--lp-urgent": "0 80% 60%",
    },
  },
  {
    id: "fresh_green",
    name: "Fresh Green",
    nameBn: "ফ্রেশ গ্রিন",
    preview: { primary: "#16A34A", bg: "#F0FDF4", accent: "#14532D" },
    vars: {
      "--lp-primary": "142 70% 38%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "138 70% 97%",
      "--lp-fg": "150 30% 12%",
      "--lp-accent": "150 70% 18%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "140 30% 94%",
      "--lp-muted-foreground": "150 10% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "140 30% 85%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 80% 55%",
    },
  },
  {
    id: "royal_purple",
    name: "Royal Purple",
    nameBn: "রয়্যাল পার্পল",
    preview: { primary: "#7C3AED", bg: "#FAF5FF", accent: "#4C1D95" },
    vars: {
      "--lp-primary": "262 83% 58%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "270 60% 98%",
      "--lp-fg": "270 30% 12%",
      "--lp-accent": "265 80% 30%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "270 30% 95%",
      "--lp-muted-foreground": "270 10% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "270 30% 88%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 80% 55%",
    },
  },
  {
    id: "ocean_blue",
    name: "Ocean Blue",
    nameBn: "ওশান ব্লু",
    preview: { primary: "#0EA5E9", bg: "#F0F9FF", accent: "#0C4A6E" },
    vars: {
      "--lp-primary": "199 89% 48%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "204 100% 97%",
      "--lp-fg": "210 30% 12%",
      "--lp-accent": "200 80% 25%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "200 30% 94%",
      "--lp-muted-foreground": "200 10% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "200 30% 88%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 80% 55%",
    },
  },
  {
    id: "sunset_orange",
    name: "Sunset Orange",
    nameBn: "সানসেট অরেঞ্জ",
    preview: { primary: "#F97316", bg: "#FFF7ED", accent: "#7C2D12" },
    vars: {
      "--lp-primary": "24 95% 53%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "33 100% 96%",
      "--lp-fg": "20 30% 12%",
      "--lp-accent": "20 70% 28%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "30 30% 95%",
      "--lp-muted-foreground": "20 10% 40%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "30 30% 88%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 85% 55%",
    },
  },
  {
    id: "minimal_clean",
    name: "Minimal Clean",
    nameBn: "মিনিমাল ক্লিন",
    preview: { primary: "#111827", bg: "#FFFFFF", accent: "#F3F4F6" },
    vars: {
      "--lp-primary": "220 30% 14%",
      "--lp-primary-foreground": "0 0% 100%",
      "--lp-bg": "0 0% 100%",
      "--lp-fg": "220 30% 14%",
      "--lp-accent": "220 15% 30%",
      "--lp-accent-foreground": "0 0% 100%",
      "--lp-muted": "220 15% 96%",
      "--lp-muted-foreground": "220 10% 45%",
      "--lp-card": "0 0% 100%",
      "--lp-border": "220 15% 90%",
      "--lp-success": "142 70% 40%",
      "--lp-urgent": "0 80% 55%",
    },
  },
];

export const getThemeById = (id: string): LandingTheme =>
  LANDING_THEMES.find((t) => t.id === id) || LANDING_THEMES[0];

export const themeToStyle = (theme: LandingTheme): React.CSSProperties => {
  return theme.vars as unknown as React.CSSProperties;
};
