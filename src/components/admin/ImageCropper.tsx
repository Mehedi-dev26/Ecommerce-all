import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  /** Crop aspect ratio (width / height). Default 21:9 banner. */
  aspect?: number;
  /** Final output dimensions written to the image. Defaults match aspect at high quality. */
  outputWidth?: number;
  outputHeight?: number;
  /** Minimum recommended source dimensions (warn if smaller). */
  minSourceWidth?: number;
  minSourceHeight?: number;
  onCropComplete: (croppedBlob: Blob) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outW: number,
  outH: number,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Render to fixed output size for consistent banner quality
  canvas.width = outW;
  canvas.height = outH;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

const ImageCropper = ({
  open,
  onClose,
  imageSrc,
  aspect = 21 / 9,
  outputWidth,
  outputHeight,
  minSourceWidth = 1200,
  minSourceHeight = 500,
  onCropComplete,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [sourceDims, setSourceDims] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);

  // Detect source image dimensions to warn if too small
  useEffect(() => {
    if (!open || !imageSrc) return;
    setSourceDims(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    createImage(imageSrc)
      .then((img) => setSourceDims({ w: img.naturalWidth, h: img.naturalHeight }))
      .catch(() => setSourceDims(null));
  }, [open, imageSrc]);

  const onCropCompleteHandler = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      // Default output: match aspect, capped at 1920 wide for banners
      const outW = outputWidth ?? 1920;
      const outH = outputHeight ?? Math.round(outW / aspect);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, outW, outH);
      onCropComplete(croppedBlob);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const tooSmall =
    sourceDims !== null &&
    (sourceDims.w < minSourceWidth || sourceDims.h < minSourceHeight);

  const targetW = outputWidth ?? 1920;
  const targetH = outputHeight ?? Math.round(targetW / aspect);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base">ছবি ক্রপ করুন</DialogTitle>
          <DialogDescription className="text-xs">
            নিচের ফ্রেমের ভেতরে যেটুকু থাকবে সেটুকুই ব্যানারে দেখাবে। মাউস/আঙুল দিয়ে সরিয়ে ও জুম করে কাঙ্ক্ষিত অংশ বেছে নিন।
          </DialogDescription>
        </DialogHeader>

        {/* Resolution guidance */}
        <div className="px-4 pb-2 space-y-1.5">
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-[11px]">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-foreground">
                চূড়ান্ত আউটপুট: <span className="text-primary">{targetW} × {targetH} px</span>
              </p>
              <p className="text-muted-foreground">
                প্রস্তাবিত উৎস ছবি: <strong>{minSourceWidth}×{minSourceHeight} px</strong> বা তার চেয়ে বড়। মোবাইল ও ডেস্কটপ উভয়ে একই ব্যানার দেখাবে — তাই ছবির গুরুত্বপূর্ণ অংশ মাঝে রাখুন।
              </p>
              {sourceDims && (
                <p className="text-muted-foreground mt-0.5">
                  আপনার ছবি: <strong>{sourceDims.w} × {sourceDims.h} px</strong>
                </p>
              )}
            </div>
          </div>
          {tooSmall && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-foreground">
                ছবিটি একটু ছোট — এটি স্ট্রেচ করলে কিছুটা ঝাপসা দেখাতে পারে। ভালো মানের জন্য কমপক্ষে {minSourceWidth}×{minSourceHeight} px ছবি ব্যবহার করুন।
              </p>
            </div>
          )}
        </div>

        <div className="relative w-full h-[300px] sm:h-[400px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            objectFit="contain"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)} className="gap-1.5">
              <RotateCw className="h-3.5 w-3.5" />
              ঘোরান
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5" disabled={saving}>
                <X className="h-3.5 w-3.5" />
                বাতিল
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5" disabled={saving || !croppedAreaPixels}>
                <Check className="h-3.5 w-3.5" />
                {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
