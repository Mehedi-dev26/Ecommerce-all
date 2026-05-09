import { supabase } from "@/integrations/supabase/client";

const FRAME_KEY = "product_frame_url";
const OUTPUT_SIZE = 1200; // square output

let cachedFrameUrl: string | null | undefined;
let frameImagePromise: Promise<HTMLImageElement | null> | null = null;

export const PRODUCT_FRAME_KEY = FRAME_KEY;

export function clearProductFrameCache() {
  cachedFrameUrl = undefined;
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
    frameImagePromise = loadImage(`${url}${url.includes("?") ? "&" : "?"}cb=frame`).catch(() => null);
  }
  return frameImagePromise;
}

/**
 * Composite a product image with the saved branding frame.
 * - Output is a square JPEG of OUTPUT_SIZE px.
 * - Product image is letterboxed (contain) on white background, centered.
 * - Frame PNG is drawn full-size on top (use a transparent-center PNG).
 * If no frame is configured, returns the original file unchanged.
 */
export async function applyProductFrame(file: File): Promise<File> {
  const frame = await getFrameImage();
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

    // Contain-fit product
    const scale = Math.min(OUTPUT_SIZE / product.width, OUTPUT_SIZE / product.height);
    const w = product.width * scale;
    const h = product.height * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(product, (OUTPUT_SIZE - w) / 2, (OUTPUT_SIZE - h) / 2, w, h);

    // Frame on top, full canvas
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
