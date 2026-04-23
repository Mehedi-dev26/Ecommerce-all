/**
 * Image URL optimizer.
 * - For Unsplash images, appends w/q/auto/fit query params so the CDN serves
 *   a properly-sized WebP/AVIF instead of the original 1MB+ JPEG.
 * - For other URLs, returns as-is.
 *
 * Use this everywhere we render remote product/category/banner images so we
 * stop shipping oversized assets (Lighthouse: "Properly size images" +
 * "Serve images in next-gen formats").
 */
export function optimizeRemoteImage(
  url: string | null | undefined,
  width = 800,
  quality = 70,
): string {
  if (!url) return "";
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality));
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return url;
  }
}
