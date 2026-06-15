import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Heart, Share2, Truck, ShieldCheck, RotateCcw, ChevronLeft, ChevronRight, Star, CheckCircle2, Package, Calculator, MapPin, Clock, Store, ChevronRight as ChevRight, MessageCircle, Phone } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";
import GradeBadge from "@/components/GradeBadge";
import ProductReviews from "@/components/ProductReviews";
import SEO from "@/components/SEO";
import { breadcrumb, productSchema } from "@/lib/seo-schemas";
import { buildProductWhatsAppMessage, buildTelUrl, buildWhatsAppUrl } from "@/lib/contact-helpers";
import { useVendorsMap } from "@/hooks/useVendorsMap";
import { getProductUrl } from "@/lib/product-url";


const DEFAULT_DELIVERY_FEE = 120;

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sizeClass} ${s <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
};

const ProductDetail = () => {
  // Supports two URL shapes:
  //   /products/:id                       (legacy UUID)
  //   /products/:vendorSlug/:serial       (professional, e.g. /products/sapahar-shop/12)
  const params = useParams<{ id?: string; vendorSlug?: string; serial?: string }>();
  const isSerialRoute = !!(params.vendorSlug && params.serial);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const WEIGHT_PRESETS = [5, 10, 20, 30];
  const [qty, setQty] = useState(5); // qty = কেজি
  const [customMode, setCustomMode] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selDivision, setSelDivision] = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", isSerialRoute ? `${params.vendorSlug}/${params.serial}` : params.id],
    queryFn: async () => {
      if (isSerialRoute) {
        const { data, error } = await (supabase as any).rpc("lookup_product_by_vendor_serial", {
          _vendor_slug: params.vendorSlug,
          _serial: Number(params.serial),
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return row || null;
      }
      const { data, error } = await supabase
        .from("products")
        .select("id,name,name_bn,description,description_bn,category_id,price,compare_price,stock,image_url,images,weight,unit,grade,is_active,is_featured,coming_soon,serial_number,created_at,updated_at,vendor_id,categories(name,name_bn)")
        .eq("id", params.id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isSerialRoute || !!params.id,
  });

  const id = (product as any)?.id;


  // Vendor info (only for vendor-listed products)
  const { data: vendorInfo } = useQuery({
    queryKey: ["product-vendor", (product as any)?.vendor_id],
    queryFn: async () => {
      const vendorId = (product as any).vendor_id as string;
      const [{ data: v }, { count }] = await Promise.all([
        supabase
          .from("vendors" as any)
          .select("id,shop_name,shop_name_bn,shop_slug,logo_url,description,division,district,upazila,total_orders,created_at,whatsapp_number,phone")
          .eq("id", vendorId)
          .eq("status", "approved")
          .maybeSingle(),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("is_active", true)
          .eq("vendor_status", "approved"),
      ]);
      return v ? { ...(v as any), product_count: count ?? 0 } : null;
    },
    enabled: !!(product as any)?.vendor_id,
  });

  // Fallback contact (main shop) from site_settings
  const { data: contactFallback } = useQuery({
    queryKey: ["site-contact-fallback"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["company_phone", "company_whatsapp"]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return { phone: map.company_phone || "", whatsapp: map.company_whatsapp || map.company_phone || "" };
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,name_bn,price,compare_price,image_url,weight,grade,coming_soon,serial_number,vendor_id,categories(name_bn)")
        .eq("category_id", product!.category_id!)
        .neq("id", id!)
        .eq("is_active", true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id && !!id,
  });

  const relatedVendorIds = (relatedProducts || []).map((r: any) => r.vendor_id);
  const { data: relatedVendors } = useVendorsMap(relatedVendorIds);


  // Real review aggregates from approved reviews for this product
  // IMPORTANT: This hook MUST be called before any early returns to comply with Rules of Hooks.
  const { data: reviewStats } = useQuery({
    queryKey: ["product-review-stats", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_reviews")
        .select("rating")
        .eq("product_id", id!)
        .eq("is_active", true)
        .eq("status", "approved");
      const list = (data || []) as { rating: number }[];
      const total = list.length;
      const avg = total > 0 ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
      return { total, avg };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-square rounded-lg" />
          </div>
          <div className="space-y-4 lg:col-span-3">
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

  const allImages: string[] = [];
  if (product.images && product.images.length > 0) {
    allImages.push(...product.images);
  } else if (product.image_url) {
    allImages.push(product.image_url);
  }

  const unitPrice = Number(product.price);
  const totalProductPrice = unitPrice * qty;
  const perKgFee = deliveryFee ?? DEFAULT_DELIVERY_FEE;
  const effectiveFee = perKgFee * qty;
  const grandTotal = totalProductPrice + effectiveFee;

  const divisionData = divisions.find((d) => d.name === selDivision);
  const districtList = divisionData?.districts || [];

  const lookupDeliveryFee = async (div: string, dist: string) => {
    setFeeLoading(true);
    try {
      const { data } = await supabase
        .from("courier_charges")
        .select("charge_per_kg")
        .eq("division", div)
        .eq("district", dist)
        .limit(1);
      if (data && data.length > 0) {
        // Treat stored value as flat fee per order for general products
        setDeliveryFee(Number((data[0] as any).charge_per_kg));
      } else {
        setDeliveryFee(null);
      }
    } catch {
      setDeliveryFee(null);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleAdd = () => {
    addItem({
      id: product.id, name: product.name, name_bn: product.name_bn,
      price: unitPrice, image_url: product.image_url, weight: `${qty} কেজি`,
      requires_advance_payment: !!(product as any).requires_advance_payment,
      advance_percent: (product as any).advance_percent ?? 50,
    }, qty);
    toast({ title: "কার্টে যোগ হয়েছে", description: `${product.name_bn} (${qty} কেজি) কার্টে যোগ করা হয়েছে।` });
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id, name: product.name, name_bn: product.name_bn,
      price: unitPrice, image_url: product.image_url, weight: `${qty} কেজি`,
      requires_advance_payment: !!(product as any).requires_advance_payment,
      advance_percent: (product as any).advance_percent ?? 50,
    }, qty);
    navigate("/checkout");
  };

  const prevImg = () => setSelectedImg((p) => (p - 1 + allImages.length) % allImages.length);
  const nextImg = () => setSelectedImg((p) => (p + 1) % allImages.length);

  const avgRating = (reviewStats?.avg ?? 0).toFixed(1);
  const totalReviews = reviewStats?.total ?? 0;

  const seoTitle = `${product.name_bn} — ৳${unitPrice.toLocaleString("en-BD")} | Sapahar Shop`;
  const rawDesc = product.description_bn || product.description || `${product.name_bn} সেরা দামে অর্ডার করুন Sapahar Shop থেকে। সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি।`;
  const seoDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  const ogImage = allImages[0];

  const canonicalProductPath = getProductUrl({
    id: product.id,
    serial_number: (product as any).serial_number,
    vendor_shop_slug: (vendorInfo as any)?.shop_slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={canonicalProductPath}
        type="product"
        image={ogImage}
        jsonLd={[
          productSchema({
            id: product.id,
            name: product.name,
            name_bn: product.name_bn,
            description: product.description,
            description_bn: product.description_bn,
            image_url: product.image_url,
            images: product.images,
            price: unitPrice,
            compare_price: product.compare_price ? Number(product.compare_price) : null,
            stock: product.stock ?? 0,
            category_name: (product as any).categories?.name_bn,
            rating: reviewStats?.avg,
            reviewCount: reviewStats?.total,
          }),
          breadcrumb([
            { name: "হোম", path: "/" },
            { name: "পণ্যসমূহ", path: "/products" },
            ...((product as any).categories?.name_bn
              ? [{ name: (product as any).categories.name_bn, path: `/products?category=${(product as any).categories.name}` }]
              : []),
            { name: product.name_bn, path: canonicalProductPath },

          ]),
        ]}
      />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border bg-card">
              {allImages.length > 0 ? (
                <img src={allImages[selectedImg]} alt={product.name_bn} className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-110" />
              ) : (
                <div className="flex h-full items-center justify-center"><Package className="h-24 w-24 text-muted-foreground/40" /></div>
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
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-20 sm:w-20 ${i === selectedImg ? "border-primary" : "border-border hover:border-primary/50"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-3">
            {(product as any).categories?.name_bn && (
              <Link to={`/products?category=${(product as any).categories?.name}`} className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary sm:text-xs">
                {(product as any).categories?.name_bn}
              </Link>
            )}
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">{product.name_bn}</h1>
              {(product as any).grade && (
                <GradeBadge grade={(product as any).grade} size="md" showLabel />
              )}
            </div>
            <p className="mb-2 text-xs text-muted-foreground sm:text-sm">{product.name}</p>

            {/* Rating summary */}
            <div className="mb-4 flex items-center gap-2">
              <StarRating rating={Math.round(Number(avgRating))} size="md" />
              <span className="text-sm font-medium text-foreground">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({totalReviews}টি রিভিউ)</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-muted-foreground">{product.stock > 0 ? <span className="text-green-600 font-medium">স্টকে আছে</span> : <span className="text-destructive font-medium">স্টকে নেই</span>}</span>
            </div>

            <Separator className="mb-4" />

            {/* Price */}
            <div className="mb-4 rounded-lg bg-muted/50 p-3 sm:p-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-bold text-primary sm:text-3xl">৳{unitPrice.toLocaleString()}</span>
                {product.compare_price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through sm:text-base">৳{Number(product.compare_price).toLocaleString()}</span>
                    <Badge variant="secondary" className="text-xs">-{discount}% ছাড়</Badge>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">প্রতি কেজি</p>
            </div>

            {/* Short Description */}
            {(product.description_bn || product.description) && (
              <div className="mb-4">
                <p className="text-sm leading-relaxed text-foreground/80 line-clamp-2 sm:text-base">{product.description_bn || product.description}</p>
              </div>
            )}

            <Separator className="mb-4" />

            {/* Weight Selection */}
            <div className="mb-4">
              <span className="mb-2 block text-xs font-semibold text-foreground sm:text-sm">
                <Package className="inline h-4 w-4 mr-1 text-primary" />
                পরিমাণ নির্বাচন করুন (কেজি)
              </span>
              <div className="flex flex-wrap gap-2">
                {WEIGHT_PRESETS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => { setCustomMode(false); setQty(w); }}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${!customMode && qty === w ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                  >
                    {w} কেজি
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${customMode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                >
                  কাস্টম
                </button>
              </div>
              {customMode && (
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 w-24 rounded-md border border-input bg-background px-3 text-center text-sm font-semibold"
                  />
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(qty + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground">কেজি</span>
                </div>
              )}
            </div>

            {/* Location for delivery fee */}
            <div className="mb-4">
              <span className="mb-2 block text-xs font-semibold text-foreground sm:text-sm">
                <MapPin className="inline h-4 w-4 mr-1 text-primary" />
                ডেলিভারি এলাকা (চার্জ জানতে)
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Select
                  value={selDivision}
                  onValueChange={(v) => { setSelDivision(v); setSelDistrict(""); setDeliveryFee(null); }}
                >
                  <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="বিভাগ" /></SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selDistrict}
                  onValueChange={(v) => { setSelDistrict(v); void lookupDeliveryFee(selDivision, v); }}
                  disabled={!selDivision}
                >
                  <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="জেলা" /></SelectTrigger>
                  <SelectContent>
                    {districtList.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {feeLoading && <p className="text-xs text-muted-foreground mt-1">চার্জ লোড হচ্ছে...</p>}
              {!feeLoading && selDistrict && deliveryFee === null && (
                <p className="text-xs text-muted-foreground mt-1">ডিফল্ট চার্জ: ৳{DEFAULT_DELIVERY_FEE}/কেজি</p>
              )}
              {!feeLoading && deliveryFee !== null && (
                <p className="text-xs text-primary font-medium mt-1">এই এলাকায় ডেলিভারি চার্জ: ৳{deliveryFee}/কেজি</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="mb-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">মূল্য হিসাব</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80">পণ্যের মূল্য ({qty} কেজি × ৳{unitPrice.toLocaleString()})</span>
                <span className="font-semibold text-foreground">৳{totalProductPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80">
                  <Truck className="inline h-3.5 w-3.5 mr-1" />
                  ডেলিভারি চার্জ ({qty} কেজি × ৳{perKgFee})
                </span>
                <span className="font-semibold text-foreground">৳{effectiveFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-bold text-foreground">সর্বমোট</span>
                <span className="font-bold text-primary text-lg">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Buy buttons */}
            <div className="mb-4 flex gap-2 sm:gap-3">
              {(product as any).coming_soon ? (
                <>
                  <Button
                    disabled
                    size="lg"
                    className="flex-1 relative overflow-hidden bg-gradient-to-r from-muted via-muted/80 to-muted text-muted-foreground border border-border/60 text-xs sm:text-sm h-10 sm:h-12 font-semibold cursor-not-allowed shadow-sm"
                  >
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
                    <Clock className="mr-1.5 h-4 w-4" />
                    <span className="tracking-wide">শীঘ্রই আসছে · Coming Soon</span>
                  </Button>
                  <Button onClick={handleAdd} size="lg" variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm h-10 sm:h-12">
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> কার্টে যোগ করুন
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleBuyNow} size="lg" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm h-10 sm:h-12 font-semibold">
                    এখনই কিনুন
                  </Button>
                  <Button onClick={handleAdd} size="lg" variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm h-10 sm:h-12">
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> কার্টে যোগ করুন
                  </Button>
                </>
              )}
            </div>

            {/* WhatsApp + Call buttons */}
            {(() => {
              const wa = vendorInfo?.whatsapp_number || vendorInfo?.phone || contactFallback?.whatsapp || "";
              const tel = vendorInfo?.phone || contactFallback?.phone || "";
              if (!wa && !tel) return null;
              const productUrl = typeof window !== "undefined" ? window.location.href : canonicalProductPath;
              const waMsg = buildProductWhatsAppMessage({
                name_bn: product.name_bn,
                price: unitPrice,
                weight: `${qty} কেজি`,
                productUrl,
                imageUrl: allImages[0],
                shopName: vendorInfo?.shop_name_bn || vendorInfo?.shop_name,
              });
              return (
                <div className="mb-5 flex gap-2 sm:gap-3">
                  {wa && (
                    <Button
                      asChild
                      size="lg"
                      className="flex-1 h-10 sm:h-12 text-xs sm:text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1faa54] shadow-sm"
                    >
                      <a href={buildWhatsAppUrl(wa, waMsg)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp-এ অর্ডার
                      </a>
                    </Button>
                  )}
                  {tel && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="flex-1 h-10 sm:h-12 text-xs sm:text-sm font-semibold border-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <a href={buildTelUrl(tel)}>
                        <Phone className="mr-1.5 h-4 w-4" /> এখনই কল করুন
                      </a>
                    </Button>
                  )}
                </div>
              );
            })()}

            {/* Wishlist + Share */}
            <div className="mb-5 flex gap-4">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive sm:text-sm transition-colors">
                <Heart className="h-4 w-4" /> পছন্দে রাখুন
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary sm:text-sm transition-colors">
                <Share2 className="h-4 w-4" /> শেয়ার
              </button>
            </div>

            {/* Service features */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { icon: Truck, label: "সারাদেশে ডেলিভারি" },
                { icon: ShieldCheck, label: "১০০% অরিজিনাল" },
                { icon: RotateCcw, label: "ক্যাশ অন ডেলিভারি" },
                { icon: Package, label: "নিরাপদ প্যাকেজিং" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 sm:px-4 sm:py-2">
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor / Seller card — Daraz style */}
        {vendorInfo && (
          <div className="mt-6 sm:mt-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 shadow-sm">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Link to={`/shop/${vendorInfo.shop_slug}`} className="shrink-0">
                    {vendorInfo.logo_url ? (
                      <img src={vendorInfo.logo_url} alt={vendorInfo.shop_name_bn} className="h-14 w-14 rounded-xl border-2 border-primary/20 object-cover sm:h-16 sm:w-16" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/10 sm:h-16 sm:w-16">
                        <Store className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/shop/${vendorInfo.shop_slug}`} className="group inline-flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary sm:text-lg line-clamp-1">
                        {vendorInfo.shop_name_bn || vendorInfo.shop_name}
                      </h3>
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">যাচাইকৃত বিক্রেতা</Badge>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{vendorInfo.upazila}, {vendorInfo.district}</span>
                      <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" />{vendorInfo.product_count} পণ্য</span>
                      <span className="inline-flex items-center gap-1"><ShoppingCart className="h-3 w-3" />{vendorInfo.total_orders} অর্ডার</span>
                    </div>
                    {vendorInfo.description && (
                      <p className="mt-2 hidden text-xs text-foreground/70 line-clamp-2 sm:block">{vendorInfo.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to={`/shop/${vendorInfo.shop_slug}`}>
                      <Store className="mr-1.5 h-4 w-4" /> দোকান ঘুরে আসুন
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 sm:mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-base">
                বিস্তারিত বিবরণ
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-base">
                রিভিউ ({totalReviews})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h3 className="mb-3 text-base font-semibold text-foreground sm:text-lg">পণ্যের বিস্তারিত</h3>
                <p className="text-sm leading-relaxed text-foreground/80 sm:text-base whitespace-pre-line">{product.description_bn || product.description || "কোনো বিবরণ নেই।"}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">১০০% অরিজিনাল ও ব্র্যান্ড নিউ</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">অফিসিয়াল ওয়ারেন্টি সহ</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">নিরাপদ ও দ্রুত ডেলিভারি</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">ক্যাশ অন ডেলিভারি সুবিধা</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ProductReviews productId={product.id} productName={product.name_bn} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <h2 className="mb-4 text-lg font-bold text-foreground sm:mb-6 sm:text-xl">একই ক্যাটাগরির পণ্য</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {relatedProducts.map((rp: any) => {
                const rpDiscount = rp.compare_price ? Math.round(((Number(rp.compare_price) - Number(rp.price)) / Number(rp.compare_price)) * 100) : 0;
                return (
                  <Link key={rp.id} to={getProductUrl({ id: rp.id, serial_number: rp.serial_number, vendor_shop_slug: relatedVendors?.[rp.vendor_id]?.shop_slug })} className="group overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {rp.image_url ? (
                        <img src={rp.image_url} alt={rp.name_bn} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/40" /></div>
                      )}
                      {rpDiscount > 0 && <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground text-[10px]">-{rpDiscount}%</Badge>}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="text-xs font-semibold text-foreground line-clamp-1 sm:text-sm">{rp.name_bn}</h3>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-primary">৳{Number(rp.price).toLocaleString()}</span>
                        {rp.compare_price && <span className="text-[10px] text-muted-foreground line-through">৳{Number(rp.compare_price).toLocaleString()}</span>}
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
