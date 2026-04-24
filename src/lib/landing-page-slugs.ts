// Reserved slugs — these cannot be used as landing page URLs
// because they conflict with existing app routes.
export const RESERVED_SLUGS = new Set<string>([
  "admin",
  "products",
  "cart",
  "checkout",
  "order-success",
  "about",
  "contact",
  "login",
  "reset-password",
  "dashboard",
  "privacy-policy",
  "terms-conditions",
  "api",
  "auth",
  "assets",
  "static",
  "public",
  "lp",
  "landing",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

export type SlugValidation = { ok: true } | { ok: false; reason: string };

export function validateSlug(slug: string): SlugValidation {
  const s = slug.trim().toLowerCase();
  if (!s) return { ok: false, reason: "URL খালি রাখা যাবে না" };
  if (s.length < 2) return { ok: false, reason: "URL কমপক্ষে ২ অক্ষরের হতে হবে" };
  if (s.length > 60) return { ok: false, reason: "URL ৬০ অক্ষরের বেশি হবে না" };
  if (!SLUG_RE.test(s))
    return {
      ok: false,
      reason: "শুধু ছোট হাতের ইংরেজি অক্ষর (a-z), সংখ্যা (0-9) এবং hyphen (-) ব্যবহার করুন",
    };
  if (RESERVED_SLUGS.has(s))
    return { ok: false, reason: `"${s}" একটি সংরক্ষিত URL — অন্য নাম ব্যবহার করুন` };
  return { ok: true };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
