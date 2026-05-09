import { supabase } from "@/integrations/supabase/client";

const FRAME_KEY = "product_frame_url";
const INSET_KEY = "product_frame_inset";
const OUTPUT_SIZE = 1200; // square output
const DEFAULT_INSET = { left: 0, top: 0, right: 1, bottom: 1 };

let cachedFrameUrl: string | null | undefined;
let cachedInset: { left: number; top: number; right: number; bottom: number } | undefined;
let frameImagePromise: Promise<HTMLImageElement | null> | null = null;
let processedFramePromise: Promise<HTMLCanvasElement | null> | null = null;

export const PRODUCT_FRAME_KEY = FRAME_KEY;
export const PRODUCT_FRAME_INSET_KEY = INSET_KEY;

export function clearProductFrameCache() {
  cachedFrameUrl = undefined;
  cachedInset = undefined;
  frameImagePromise = null;
  processedFramePromise = null;
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
 * Build a frame canvas where pixels inside the inner rect that are near-white
 * are made transparent — so the product shows through, while the border and
 * decorative graphics (mangoes etc.) remain visible on top.
 */
async function getProcessedFrame(): Promise<HTMLCanvasElement | null> {
  if (processedFramePromise) return processedFramePromise;
  processedFramePromise = (async () => {
    const [frame, inset] = await Promise.all([getFrameImage(), fetchInset()]);
    if (!frame) return null;
    const c = document.createElement("canvas");
    c.width = OUTPUT_SIZE;
    c.height = OUTPUT_SIZE;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(frame, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const rx = Math.max(0, Math.floor(inset.left * OUTPUT_SIZE));
    const ry = Math.max(0, Math.floor(inset.top * OUTPUT_SIZE));
    const rw = Math.max(0, Math.ceil(inset.right * OUTPUT_SIZE) - rx);
    const rh = Math.max(0, Math.ceil(inset.bottom * OUTPUT_SIZE) - ry);
    if (rw > 0 && rh > 0) {
      try {
        const img = ctx.getImageData(rx, ry, rw, rh);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // Near-white → transparent (smooth fade for edge antialiasing)
          const minC = Math.min(r, g, b);
          if (minC >= 230) {
            d[i + 3] = 0;
          } else if (minC >= 200) {
            d[i + 3] = Math.round(d[i + 3] * (1 - (minC - 200) / 30));
          }
        }
        ctx.putImageData(img, rx, ry);
      } catch (e) {
        console.warn("frame processing failed", e);
      }
    }
    return c;
  })();
  return processedFramePromise;
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
  const [frame, inset] = await Promise.all([getProcessedFrame(), fetchInset()]);
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

    // Compute inner rect from inset fractions
    const rx = Math.max(0, Math.min(1, inset.left)) * OUTPUT_SIZE;
    const ry = Math.max(0, Math.min(1, inset.top)) * OUTPUT_SIZE;
    const rw = Math.max(0, Math.min(1, inset.right) - inset.left) * OUTPUT_SIZE;
    const rh = Math.max(0, Math.min(1, inset.bottom) - inset.top) * OUTPUT_SIZE;

    // Cover-fit product inside the inner rect (auto-zoom to fill, crop overflow)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const scale = Math.max(rw / product.width, rh / product.height);
    const w = product.width * scale;
    const h = product.height * scale;
    const dx = rx + (rw - w) / 2;
    const dy = ry + (rh - h) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    ctx.drawImage(product, dx, dy, w, h);
    ctx.restore();

    // Draw frame on top so the border + decorative graphics overlay the product
    ctx.drawImage(frame, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

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
