import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import SEO from "@/components/SEO";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const shippingCost = totalPrice >= 2000 ? 0 : 120;

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center px-4 py-20">
        <SEO title="শপিং কার্ট" description="আপনার শপিং কার্ট দেখুন ও Sapahar Mango Shop থেকে অর্ডার সম্পন্ন করুন।" path="/cart" noindex />
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">আপনার কার্ট খালি</h2>
        <p className="mb-6 text-muted-foreground">পছন্দের পণ্য যোগ করুন</p>
        <Button asChild><Link to="/products">পণ্য দেখুন</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO title="শপিং কার্ট" description="আপনার নির্বাচিত পণ্যসমূহ দেখুন এবং চেকআউট সম্পন্ন করুন।" path="/cart" noindex />
      <h1 className="mb-8 text-3xl font-bold text-foreground">শপিং কার্ট</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name_bn} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/50" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{item.name_bn}</h3>
                  <p className="text-sm text-muted-foreground">{item.weight}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center text-sm">{item.quantity} কেজি</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-semibold text-primary">৳{item.price * item.quantity}</span>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">অর্ডার সামারি</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>৳{totalPrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>{shippingCost === 0 ? "ফ্রি" : `৳${shippingCost}`}</span></div>
            {shippingCost > 0 && <p className="text-xs text-muted-foreground">৳২,০০০+ অর্ডারে ফ্রি ডেলিভারি</p>}
            <div className="border-t pt-2 flex justify-between font-semibold text-base">
              <span>মোট</span><span className="text-primary">৳{totalPrice + shippingCost}</span>
            </div>
          </div>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/checkout">চেকআউট করুন</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
