import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Heart, Share2, Truck, ShieldCheck, RotateCcw, ChevronLeft, ChevronRight, Star, ThumbsUp, CheckCircle2, Package, ZoomIn, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/ProductCard";

const fakeReviews = [
  { id: 1, name: "রহিম উদ্দিন", rating: 5, date: "২০ মে, ২০২৬", comment: "অসাধারণ পণ্য! স্বাদ খুবই ভালো এবং একদম খাঁটি। আবার অর্ডার করবো।", verified: true },
  { id: 2, name: "ফাতেমা বেগম", rating: 4, date: "১৫ মে, ২০২৬", comment: "পণ্যের মান ভালো, প্যাকেজিংও সুন্দর ছিল। ডেলিভারি সময়মতো হয়েছে।", verified: true },
  { id: 3, name: "কামরুল হাসান", rating: 5, date: "১০ মে, ২০২৬", comment: "বাজারে এত খাঁটি পণ্য পাওয়া কঠিন। মারফু থেকে নিলে ভেজাল নিয়ে চিন্তা নেই। পরিবারের সবাই পছন্দ করেছে।", verified: true },
  { id: 4, name: "সাবিনা আক্তার", rating: 4, date: "৫ মে, ২০২৬", comment: "ভালো পণ্য, তবে আরেকটু বেশি পরিমাণে থাকলে ভালো হতো। স্বাদে কোনো অভিযোগ নেই।", verified: false },
];

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sizeClass} ${s <= rating ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
};

// Image Zoom Modal
const ZoomModal = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPosition((p) => ({
      x: p.x + e.clientX - lastPos.current.x,
      y: p.y + e.clientY - lastPos.current.y,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-card p-2 shadow-lg hover:bg-muted">
        <X className="h-5 w-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-card/90 px-4 py-2 shadow-lg backdrop-blur-sm">
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(1, s - 0.5)); }} className="text-sm font-bold text-foreground hover:text-primary">−</button>
        <span className="text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(4, s + 0.5)); }} className="text-sm font-bold text-foreground hover:text-primary">+</button>
      </div>
      <div
        className="max-h-[90vh] max-w-[90vw] cursor-grab overflow-hidden active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-150"
          style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
          draggable={false}
        />
      </div>
    </div>
  );
};

// Magnifier lens on hover (desktop)
const ImageWithMagnifier = ({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) => {
  const [showMag, setShowMag] = useState(false);
  const [magPos, setMagPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, bgX: x, bgY: y });
  };

  return (
    <div
      ref={imgRef}
      className="group relative h-full w-full cursor-crosshair"
      onMouseEnter={() => setShowMag(true)}
      onMouseLeave={() => setShowMag(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <img src={src} alt={alt} className="h-full w-full object-contain p-2" draggable={false} />
      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-card/80 px-2.5 py-1 text-[10px] text-muted-foreground opacity-0 shadow backdrop-blur-sm transition group-hover:opacity-100">
        <ZoomIn className="h-3 w-3" /> ক্লিক করে জুম করুন
      </div>
      {/* Magnifier lens */}
      {showMag && (
        <div
          className="pointer-events-none absolute z-10 hidden h-36 w-36 rounded-full border-2 border-primary/30 shadow-lg lg:block"
          style={{
            left: magPos.x - 72,
            top: magPos.y - 72,
            backgroundImage: `url(${src})`,
            backgroundSize: "500%",
            backgroundPosition: `${magPos.bgX}% ${magPos.bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name, name_bn)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name_bn)")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .eq("is_active", true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4"><Skeleton className="aspect-square rounded-lg" /></div>
          <div className="space-y-4 lg:col-span-5"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /></div>
          <div className="lg:col-span-3"><Skeleton className="h-64 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">পণ্য পাওয়া যায়নি</div>;
  }

  const discount = product.compare_price ? Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100) : 0;

  const allImages: string[] = [];
  if (product.images && product.images.length > 0) {
    allImages.push(...product.images);
  } else if (product.image_url) {
    allImages.push(product.image_url);
  }

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, name_bn: product.name_bn, price: Number(product.price), image_url: product.image_url, weight: product.weight }, qty);
    toast({ title: "কার্টে যোগ হয়েছে", description: `${product.name_bn} (${qty}টি) কার্টে যোগ করা হয়েছে।` });
  };

  const handleBuyNow = () => {
    addItem({ id: product.id, name: product.name, name_bn: product.name_bn, price: Number(product.price), image_url: product.image_url, weight: product.weight }, qty);
    window.location.href = "/checkout";
  };

  const prevImg = () => setSelectedImg((p) => (p - 1 + allImages.length) % allImages.length);
  const nextImg = () => setSelectedImg((p) => (p + 1) % allImages.length);

  const avgRating = (fakeReviews.reduce((s, r) => s + r.rating, 0) / fakeReviews.length).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Zoom Modal */}
      {zoomOpen && allImages.length > 0 && (
        <ZoomModal src={allImages[selectedImg]} alt={product.name_bn} onClose={() => setZoomOpen(false)} />
      )}

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-sm">
            <Link to="/" className="hover:text-primary">হোম</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">পণ্যসমূহ</Link>
            {(product as any).categories?.name_bn && (
              <>
                <span>/</span>
                <Link to={`/products?category=${(product as any).categories?.name}`} className="hover:text-primary">
                  {(product as any).categories?.name_bn}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name_bn}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* ============ DESKTOP: 3-column layout ============ */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">

          {/* Column 1: Image Gallery */}
          <div className="lg:col-span-4">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border bg-card">
              {allImages.length > 0 ? (
                <ImageWithMagnifier src={allImages[selectedImg]} alt={product.name_bn} onClick={() => setZoomOpen(true)} />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl">🥭</div>
              )}
              {discount > 0 && (
                <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground px-2.5 py-1 text-xs sm:text-sm">-{discount}%</Badge>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 shadow backdrop-blur-sm hover:bg-card">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 shadow backdrop-blur-sm hover:bg-card">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.length > 1 ? allImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-16 ${i === selectedImg ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/50"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              )) : allImages.length === 1 && (
                <button className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-primary ring-1 ring-primary/30 sm:h-16 sm:w-16">
                  <img src={allImages[0]} alt="" className="h-full w-full object-cover" />
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Product Info */}
          <div className="lg:col-span-5">
            {(product as any).categories?.name_bn && (
              <Link to={`/products?category=${(product as any).categories?.name}`} className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary sm:text-xs">
                {(product as any).categories?.name_bn}
              </Link>
            )}
            <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">{product.name_bn}</h1>
            <p className="mb-2 text-xs text-muted-foreground sm:text-sm">{product.name}</p>

            {/* Rating */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <StarRating rating={Math.round(Number(avgRating))} size="md" />
              <span className="text-sm font-medium text-foreground">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({fakeReviews.length}টি রিভিউ)</span>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <span className="text-xs">{product.stock > 0 ? <span className="text-primary font-medium">স্টকে আছে</span> : <span className="text-destructive font-medium">স্টকে নেই</span>}</span>
            </div>

            <Separator className="mb-3" />

            {/* Price */}
            <div className="mb-3 rounded-lg bg-muted/50 p-3 sm:p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-primary sm:text-3xl">৳{Number(product.price)}</span>
                {product.compare_price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through sm:text-base">৳{Number(product.compare_price)}</span>
                    <Badge variant="secondary" className="text-xs">-{discount}% ছাড়</Badge>
                  </>
                )}
              </div>
              {product.weight && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">পরিমাণ: {product.weight}</p>}
            </div>

            {/* Short Description */}
            {(product.description_bn || product.description) && (
              <p className="mb-3 text-sm leading-relaxed text-foreground/80 line-clamp-2 sm:text-base">{product.description_bn || product.description}</p>
            )}

            <Separator className="mb-3" />

            {/* Quantity + Buy (shown on mobile, hidden on lg) */}
            <div className="lg:hidden">
              <div className="mb-3 flex items-center gap-1">
                <span className="mr-2 text-xs font-medium text-foreground sm:text-sm">পরিমাণ:</span>
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
                <span className="ml-2 text-[11px] text-muted-foreground">({product.stock}টি স্টকে)</span>
              </div>
              <div className="mb-3 flex gap-2">
                <Button onClick={handleBuyNow} size="lg" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs h-10">এখনই কিনুন</Button>
                <Button onClick={handleAdd} size="lg" variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs h-10">
                  <ShoppingCart className="mr-1 h-4 w-4" /> কার্টে যোগ করুন
                </Button>
              </div>
              <div className="mb-4 flex gap-4">
                <button onClick={() => { setWishlisted(!wishlisted); toast({ title: wishlisted ? "পছন্দ থেকে সরানো হয়েছে" : "পছন্দে যোগ হয়েছে" }); }} className={`flex items-center gap-1.5 text-xs transition-colors ${wishlisted ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-destructive" : ""}`} /> পছন্দে রাখুন
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" /> শেয়ার
                </button>
              </div>
              {/* Trust badges mobile */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Truck, label: "সারাদেশে ডেলিভারি" },
                  { icon: ShieldCheck, label: "১০০% খাঁটি" },
                  { icon: RotateCcw, label: "ক্যাশ অন ডেলিভারি" },
                  { icon: Package, label: "নিরাপদ প্যাকেজিং" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wishlist + Share (desktop) */}
            <div className="hidden lg:flex gap-4 mb-3">
              <button onClick={() => { setWishlisted(!wishlisted); toast({ title: wishlisted ? "পছন্দ থেকে সরানো হয়েছে" : "পছন্দে যোগ হয়েছে" }); }} className={`flex items-center gap-1.5 text-sm transition-colors ${wishlisted ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-destructive" : ""}`} /> পছন্দে রাখুন
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" /> শেয়ার
              </button>
            </div>
          </div>

          {/* Column 3: Purchase Card (desktop only) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              {/* Price in card */}
              <div>
                <span className="text-2xl font-bold text-primary">৳{Number(product.price)}</span>
                {product.compare_price && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">৳{Number(product.compare_price)}</span>
                )}
              </div>

              {/* Quantity */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-foreground">পরিমাণ নির্বাচন করুন</span>
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                  <span className="flex-1 text-center text-sm font-semibold">{qty}</span>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
                <span className="mt-1 block text-[11px] text-muted-foreground">{product.stock}টি স্টকে আছে</span>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <Button onClick={handleBuyNow} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-11">
                  এখনই কিনুন
                </Button>
                <Button onClick={handleAdd} variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground h-11">
                  <ShoppingCart className="mr-1.5 h-4 w-4" /> কার্টে যোগ করুন
                </Button>
              </div>

              <Separator />

              {/* Trust badges vertical */}
              <div className="space-y-2.5">
                {[
                  { icon: Truck, label: "সারাদেশে ডেলিভারি" },
                  { icon: ShieldCheck, label: "১০০% খাঁটি পণ্য" },
                  { icon: RotateCcw, label: "ক্যাশ অন ডেলিভারি" },
                  { icon: Package, label: "নিরাপদ প্যাকেজিং" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description + Reviews */}
        <div className="mt-8 sm:mt-12">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-base">
                বিস্তারিত বিবরণ
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-base">
                রিভিউ ({fakeReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h3 className="mb-3 text-base font-semibold text-foreground sm:text-lg">পণ্যের বিস্তারিত</h3>
                <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">{product.description_bn || product.description || "কোনো বিবরণ নেই।"}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {["কোনো কেমিক্যাল বা প্রিজারভেটিভ নেই", "সম্পূর্ণ হাতে তৈরি", "ঐতিহ্যবাহী রেসিপি", "প্রিমিয়াম প্যাকেজিং"].map((text) => (
                    <div key={text} className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {/* Review Summary */}
              <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:p-6">
                <div className="flex flex-col items-center gap-1 sm:min-w-[120px]">
                  <span className="text-4xl font-bold text-foreground">{avgRating}</span>
                  <StarRating rating={Math.round(Number(avgRating))} size="md" />
                  <span className="text-xs text-muted-foreground">{fakeReviews.length}টি রিভিউ</span>
                </div>
                <Separator orientation="vertical" className="hidden h-20 sm:block" />
                <Separator className="sm:hidden" />
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = fakeReviews.filter((r) => r.rating === star).length;
                    const pct = (count / fakeReviews.length) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-3 text-xs text-muted-foreground">{star}</span>
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-[11px] text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {fakeReviews.map((review) => (
                  <div key={review.id} className="rounded-lg border bg-card p-4 sm:p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{review.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{review.name}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                                <CheckCircle2 className="h-2.5 w-2.5" /> যাচাইকৃত
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{review.date}</span>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" /> সহায়ক
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <h2 className="mb-4 text-lg font-bold text-foreground sm:mb-6 sm:text-xl">একই ক্যাটাগরির পণ্য</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {relatedProducts.map((rp: any) => (
                <ProductCard key={rp.id} id={rp.id} name={rp.name} name_bn={rp.name_bn} price={rp.price} compare_price={rp.compare_price} image_url={rp.image_url} weight={rp.weight} category_name_bn={rp.categories?.name_bn} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
