import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, ArrowLeft, Heart, Share2, Truck, ShieldCheck, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name, name_bn)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Related products
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">পণ্য পাওয়া যায়নি</div>;
  }

  const discount = product.compare_price ? Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100) : 0;

  // Build image gallery from images array or fallback to single image_url
  const allImages: string[] = [];
  if (product.images && product.images.length > 0) {
    allImages.push(...product.images);
  } else if (product.image_url) {
    allImages.push(product.image_url);
  }

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      name_bn: product.name_bn,
      price: Number(product.price),
      image_url: product.image_url,
      weight: product.weight,
    }, qty);
    toast({ title: "কার্টে যোগ হয়েছে", description: `${product.name_bn} (${qty}টি) কার্টে যোগ করা হয়েছে।` });
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      name: product.name,
      name_bn: product.name_bn,
      price: Number(product.price),
      image_url: product.image_url,
      weight: product.weight,
    }, qty);
    window.location.href = "/checkout";
  };

  const prevImg = () => setSelectedImg((p) => (p - 1 + allImages.length) % allImages.length);
  const nextImg = () => setSelectedImg((p) => (p + 1) % allImages.length);

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          {/* Image Gallery - Daraz style */}
          <div>
            {/* Main image */}
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border bg-card">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImg]}
                  alt={product.name_bn}
                  className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl">🥭</div>
              )}
              {discount > 0 && (
                <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground px-2.5 py-1 text-xs sm:text-sm">
                  -{discount}%
                </Badge>
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
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-20 sm:w-20 ${
                      i === selectedImg ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {(product as any).categories?.name_bn && (
              <Link to={`/products?category=${(product as any).categories?.name}`} className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary sm:text-xs">
                {(product as any).categories?.name_bn}
              </Link>
            )}
            <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl md:text-3xl">{product.name_bn}</h1>
            <p className="mb-3 text-xs text-muted-foreground sm:text-sm">{product.name}</p>

            {/* Rating placeholder */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex gap-0.5 text-secondary">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-sm sm:text-base">★</span>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground sm:text-xs">(রিভিউ নেই)</span>
            </div>

            <Separator className="mb-4" />

            {/* Price section */}
            <div className="mb-4 rounded-lg bg-muted/50 p-3 sm:p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-primary sm:text-3xl">৳{Number(product.price)}</span>
                {product.compare_price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through sm:text-base">৳{Number(product.compare_price)}</span>
                    <Badge variant="secondary" className="text-xs">-{discount}%</Badge>
                  </>
                )}
              </div>
              {product.weight && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">পরিমাণ: {product.weight}</p>}
            </div>

            {/* Description */}
            {(product.description_bn || product.description) && (
              <div className="mb-4">
                <h3 className="mb-1.5 text-sm font-semibold text-foreground sm:text-base">বিবরণ</h3>
                <p className="text-xs leading-relaxed text-foreground/80 sm:text-sm">{product.description_bn || product.description}</p>
              </div>
            )}

            <Separator className="mb-4" />

            {/* Quantity + Actions */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1">
                <span className="mr-2 text-xs font-medium text-foreground sm:text-sm">পরিমাণ:</span>
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setQty(qty + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="ml-2 text-[11px] text-muted-foreground sm:text-xs">({product.stock}টি স্টকে আছে)</span>
              </div>
            </div>

            {/* Buy buttons - Daraz style */}
            <div className="mb-4 flex gap-2 sm:gap-3">
              <Button onClick={handleBuyNow} size="lg" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs sm:text-sm h-10 sm:h-12">
                এখনই কিনুন
              </Button>
              <Button onClick={handleAdd} size="lg" variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm h-10 sm:h-12">
                <ShoppingCart className="mr-1.5 h-4 w-4" /> কার্টে যোগ করুন
              </Button>
            </div>

            {/* Wishlist + Share */}
            <div className="mb-5 flex gap-3">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive sm:text-sm">
                <Heart className="h-4 w-4" /> পছন্দে রাখুন
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary sm:text-sm">
                <Share2 className="h-4 w-4" /> শেয়ার
              </button>
            </div>

            {/* Service features */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-card p-3 sm:p-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <span className="text-[10px] font-medium text-foreground sm:text-xs">সারাদেশে ডেলিভারি</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <span className="text-[10px] font-medium text-foreground sm:text-xs">১০০% খাঁটি</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <span className="text-[10px] font-medium text-foreground sm:text-xs">ক্যাশ অন ডেলিভারি</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <h2 className="mb-4 text-lg font-bold text-foreground sm:mb-6 sm:text-xl">একই ক্যাটাগরির পণ্য</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {relatedProducts.map((rp: any) => {
                const rpDiscount = rp.compare_price ? Math.round(((Number(rp.compare_price) - Number(rp.price)) / Number(rp.compare_price)) * 100) : 0;
                return (
                  <Link key={rp.id} to={`/products/${rp.id}`} className="group overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {rp.image_url ? (
                        <img src={rp.image_url} alt={rp.name_bn} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🥭</div>
                      )}
                      {rpDiscount > 0 && <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground text-[10px]">-{rpDiscount}%</Badge>}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="text-xs font-semibold text-foreground line-clamp-1 sm:text-sm">{rp.name_bn}</h3>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-primary">৳{Number(rp.price)}</span>
                        {rp.compare_price && <span className="text-[10px] text-muted-foreground line-through">৳{Number(rp.compare_price)}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
