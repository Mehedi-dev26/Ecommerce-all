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
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img src={image_url} alt={name_bn} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🥭</div>
          )}
          {discount > 0 && (
            <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground">{discount}% ছাড়</Badge>
          )}
        </div>
        <CardContent className="p-4">
          {category_name_bn && <p className="mb-1 text-xs text-muted-foreground">{category_name_bn}</p>}
          <h3 className="mb-1 font-semibold text-foreground">{name_bn}</h3>
          <p className="mb-1 text-xs text-muted-foreground">{name}</p>
          {weight && <p className="mb-2 text-xs text-muted-foreground">{weight}</p>}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">৳{price}</span>
              {compare_price && <span className="text-sm text-muted-foreground line-through">৳{compare_price}</span>}
            </div>
            <Button size="sm" onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
