import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name, name_bn)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
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

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> পণ্যসমূহে ফিরে যান
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name_bn} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl">🥭</div>
          )}
          {discount > 0 && <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground text-base px-3 py-1">{discount}% ছাড়</Badge>}
        </div>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{(product as any).categories?.name_bn}</p>
          <h1 className="mb-1 text-3xl font-bold text-foreground">{product.name_bn}</h1>
          <p className="mb-4 text-muted-foreground">{product.name}</p>
          {product.weight && <p className="mb-4 text-sm text-muted-foreground">ওজন: {product.weight}</p>}
          <div className="mb-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">৳{Number(product.price)}</span>
            {product.compare_price && <span className="text-lg text-muted-foreground line-through">৳{Number(product.compare_price)}</span>}
          </div>
          <p className="mb-6 text-foreground/80">{product.description_bn || product.description}</p>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-12 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button size="lg" onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="mr-2 h-5 w-5" /> কার্টে যোগ করুন
            </Button>
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-muted-foreground">✅ স্টকে আছে: {product.stock}টি</p>
            <p className="text-muted-foreground">🚚 সারা বাংলাদেশে ডেলিভারি</p>
            <p className="text-muted-foreground">💰 ক্যাশ অন ডেলিভারি</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
