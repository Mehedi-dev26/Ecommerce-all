// Build-time sitemap generator for Surzo Shop.
// Runs after `vite build`. Fetches active products from Supabase
// (using the public anon key) and writes /dist/sitemap.xml.
//
// No server-side secrets needed: we use the publishable anon key
// already exposed to the client.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SITE_URL = "https://surzoshop.com";

// Read VITE_* vars from .env (so we don't hard-code anything brittle).
const loadEnv = () => {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
};

const env = { ...loadEnv(), ...process.env };
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms-conditions", priority: "0.3", changefreq: "yearly" },
];

const fetchProducts = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[sitemap] Supabase env not found — generating static-only sitemap.");
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/products?select=id,updated_at&is_active=eq.true&order=updated_at.desc`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`[sitemap] Supabase responded ${res.status}; skipping product URLs.`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("[sitemap] Failed to fetch products:", err.message);
    return [];
  }
};

const fetchCategories = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const url = `${SUPABASE_URL}/rest/v1/categories?select=name`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
};

const xmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const urlEntry = (loc, lastmod, changefreq = "weekly", priority = "0.7") => `
  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const main = async () => {
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);

  const today = new Date().toISOString();
  const parts = [];

  for (const r of STATIC_ROUTES) {
    parts.push(urlEntry(`${SITE_URL}${r.path === "/" ? "" : r.path}`, today, r.changefreq, r.priority));
  }
  for (const c of categories) {
    parts.push(
      urlEntry(`${SITE_URL}/products?category=${encodeURIComponent(c.name)}`, today, "weekly", "0.7"),
    );
  }
  for (const p of products) {
    parts.push(urlEntry(`${SITE_URL}/products/${p.id}`, p.updated_at || today, "weekly", "0.8"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${parts.join("")}
</urlset>
`;

  const distDir = resolve(ROOT, "dist");
  const publicDir = resolve(ROOT, "public");
  const writeTargets = [];
  if (existsSync(distDir)) writeTargets.push(resolve(distDir, "sitemap.xml"));
  // Always also write into /public so dev preview & re-builds pick it up.
  writeTargets.push(resolve(publicDir, "sitemap.xml"));

  for (const t of writeTargets) {
    writeFileSync(t, xml, "utf8");
    console.log(`[sitemap] wrote ${t} (${products.length} products, ${categories.length} categories)`);
  }
};

main().catch((err) => {
  console.error("[sitemap] failed:", err);
  process.exitCode = 0; // never fail the build
});
