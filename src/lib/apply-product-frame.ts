import { supabase } from "@/integrations/supabase/client";

const FRAME_KEY = "product_frame_url";
const INSET_KEY = "product_frame_inset";
const OUTPUT_SIZE = 1200; // square output
const DEFAULT_INSET = { left: 0, top: 0, right: 1, bottom: 1 };

let cachedFrameUrl: string | null | undefined;
let cachedInset: { left: number; top: number; right: number; bottom: number } | undefined;
let frameImagePromise: Promise<HTMLImageElement | null> | null = null;

export const PRODUCT_FRAME_KEY = FRAME_KEY;
export const PRODUCT_FRAME_INSET_KEY = INSET_KEY;

export function clearProductFrameCache() {
  cachedFrameUrl = undefined;
  cachedInset = undefined;
  frameImagePromise = null;
}

async function fetchFrameUrl(): Promise<string | null> {
  if (cachedFrameUrl !== undefined) return cachedFrameUrl;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", FRAME_KEY)
    .maybeSingle();
  cachedFrameUrl = (data?.value || "").trim() || null;
  return cachedFrameUrl;
}

async function fetchInset() {
  if (cachedInset !== undefined) return cachedInset;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", INSET_KEY)
    .maybeSingle();
  try {
    const parsed = data?.value ? JSON.parse(data.value) : null;
    if (parsed && typeof parsed === "object") {
      cachedInset = {
        left: Number(parsed.left ?? 0),
        top: Number(parsed.top ?? 0),
        right: Number(parsed.right ?? 1),
        bottom: Number(parsed.bottom ?? 1),
      };
    } else {
      cachedInset = DEFAULT_INSET;
    }
  } catch {
    cachedInset = DEFAULT_INSET;
  }
  return cachedInset;
}

function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getFrameImage(): Promise<HTMLImageElement | null> {
  const url = await fetchFrameUrl();
  if (!url) return null;
  if (!frameImagePromise) {
    const isAbsolute = /^https?:\/\//i.test(url);
    const src = isAbsolute ? `${url}${url.includes("?") ? "&" : "?"}cb=frame` : url;
    frameImagePromise = loadImage(src, isAbsolute).catch(() => null);
  }
  return frameImagePromise;
}

/**
 * Composite a product image with the saved branding frame.
 * - Output is a square JPEG of OUTPUT_SIZE px.
 * - Frame is drawn full-size first.
 * - Product image is letterboxed (contain) inside the configured inner rect
 *   (saved in site_settings as `product_frame_inset` — fractions 0..1).
 * If no frame is configured, returns the original file unchanged.
 */
export async function applyProductFrame(file: File): Promise<File> {
  const [frame, inset] = await Promise.all([getFrameImage(), fetchInset()]);
  if (!frame) return file;

  const productUrl = URL.createObjectURL(file);
  try {
    const product = await loadImage(productUrl, false);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Draw frame first (full canvas)
    ctx.drawImage(frame, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Compute inner rect from inset fractions
    const rx = Math.max(0, Math.min(1, inset.left)) * OUTPUT_SIZE;
    const ry = Math.max(0, Math.min(1, inset.top)) * OUTPUT_SIZE;
    const rw = Math.max(0, Math.min(1, inset.right) - inset.left) * OUTPUT_SIZE;
    const rh = Math.max(0, Math.min(1, inset.bottom) - inset.top) * OUTPUT_SIZE;

    // Contain-fit product inside the inner rect
    const scale = Math.min(rw / product.width, rh / product.height);
    const w = product.width * scale;
    const h = product.height * scale;
    const dx = rx + (rw - w) / 2;
    const dy = ry + (rh - h) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(product, dx, dy, w, h);

    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.9),
    );
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}-framed.jpg`, { type: "image/jpeg" });
  } catch (err) {
    console.warn("applyProductFrame failed; using original file", err);
    return file;
  } finally {
    URL.revokeObjectURL(productUrl);
  }
}
