import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GradeBadge from "@/components/GradeBadge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { optimizeRemoteImage } from "@/lib/image-url";

interface ProductCardProps {
  id: string;
  name: string;
  name_bn: string;
  price: number;
  compare_price?: number | null;
  image_url?: string | null;
  weight?: string | null;
  category_name_bn?: string;
  grade?: string | null;
  coming_soon?: boolean | null;
  vendor_shop_name_bn?: string | null;
  vendor_shop_slug?: string | null;
  hideSeller?: boolean;
}

const ProductCard = ({ id, name, name_bn, price, compare_price, image_url, weight, category_name_bn, grade, coming_soon, vendor_shop_name_bn, vendor_shop_slug, hideSeller }: ProductCardProps) => {
  const { addItem } = useCart();
  const [wishlisted, setWishlisted] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, name, name_bn, price, image_url: image_url || null, weight: weight || null });
    toast({ title: "কার্টে যোগ হয়েছে", description: `${name_bn} কার্টে যোগ করা হয়েছে।` });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted(!wishlisted);
    toast({
      title: wishlisted ? "পছন্দ থেকে সরানো হয়েছে" : "পছন্দে যোগ হয়েছে",
      description: `${name_bn} ${wishlisted ? "পছন্দ তালিকা থেকে সরানো হয়েছে।" : "পছন্দ তালিকায় যোগ করা হয়েছে।"}`,
    });
  };

  const discount = compare_price ? Math.round(((compare_price - price) / compare_price) * 100) : 0;

  return (
    <Link to={`/products/${id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={optimizeRemoteImage(image_url, 480)}
              alt={name_bn}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              width={480}
              height={480}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center"><ShoppingCart className="h-12 w-12 text-muted-foreground/40" /></div>
          )}
          {discount > 0 && (
            <Badge className="absolute left-1.5 top-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 sm:left-2 sm:top-2 sm:text-xs sm:px-2 sm:py-0.5">{discount}% ছাড়</Badge>
          )}
          {coming_soon && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-foreground/85 via-foreground/55 to-transparent py-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm sm:text-xs">
                <Clock className="h-3 w-3" /> শীঘ্রই আসছে
              </span>
            </div>
          )}
          {grade && (
            <div className="absolute left-1.5 bottom-1.5 sm:left-2 sm:bottom-2">
              <GradeBadge grade={grade} size="xs" />
            </div>
          )}
          {/* Wishlist heart icon */}
          <button
            onClick={handleWishlist}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:bg-card sm:right-2 sm:top-2 sm:h-8 sm:w-8"
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${wishlisted ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"}`} />
          </button>
        </div>
        <CardContent className="p-2.5 sm:p-3">
          {category_name_bn && <p className="mb-0.5 text-[10px] text-muted-foreground">{category_name_bn}</p>}
          <h3 className="mb-0.5 text-xs font-semibold text-foreground sm:text-sm line-clamp-1">
            {name_bn}
          </h3>
          {weight && <p className="mb-1 text-[10px] text-muted-foreground">{weight}</p>}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-primary sm:text-base">৳{price}</span>
              {compare_price && <span className="text-[10px] text-muted-foreground line-through sm:text-xs">৳{compare_price}</span>}
            </div>
            <Button size="sm" onClick={handleAdd} className="h-7 w-7 p-0 sm:h-8 sm:w-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
          {!hideSeller && vendor_shop_name_bn && (
            <div
              role="link"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (vendor_shop_slug) window.location.href = `/shop/${vendor_shop_slug}`; }}
              className="mt-1.5 flex items-center gap-1 border-t border-border/60 pt-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate">বিক্রেতা: <span className="font-medium text-foreground/90 hover:text-primary">{vendor_shop_name_bn}</span></span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
