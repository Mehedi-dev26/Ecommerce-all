import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  name_bn: string;
  price: number;
  compare_price?: number | null;
  image_url?: string | null;
  weight?: string | null;
  category_name_bn?: string;
}

const ProductCard = ({ id, name, name_bn, price, compare_price, image_url, weight, category_name_bn }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, name, name_bn, price, image_url: image_url || null, weight: weight || null });
    toast({ title: "কার্টে যোগ হয়েছে", description: `${name_bn} কার্টে যোগ করা হয়েছে।` });
  };

  const discount = compare_price ? Math.round(((compare_price - price) / compare_price) * 100) : 0;

  return (
    <Link to={`/products/${id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img src={image_url} alt={name_bn} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl sm:text-5xl">🥭</div>
          )}
          {discount > 0 && (
            <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground text-xs">{discount}% ছাড়</Badge>
          )}
        </div>
        <CardContent className="p-3 sm:p-4">
          {category_name_bn && <p className="mb-0.5 text-[10px] text-muted-foreground sm:text-xs">{category_name_bn}</p>}
          <h3 className="mb-0.5 text-sm font-semibold text-foreground sm:text-base line-clamp-1">{name_bn}</h3>
          <p className="mb-0.5 text-[10px] text-muted-foreground sm:text-xs line-clamp-1">{name}</p>
          {weight && <p className="mb-1.5 text-[10px] text-muted-foreground sm:mb-2 sm:text-xs">{weight}</p>}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-sm font-bold text-primary sm:text-lg">৳{price}</span>
              {compare_price && <span className="text-[10px] text-muted-foreground line-through sm:text-sm">৳{compare_price}</span>}
            </div>
            <Button size="sm" onClick={handleAdd} className="h-7 w-7 p-0 sm:h-8 sm:w-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
