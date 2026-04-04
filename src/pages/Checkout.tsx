import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "ঢাকা", district: "", notes: "",
  });

  const shippingCost = totalPrice >= 2000 ? 0 : 120;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      const orderNumber = `MW-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        shipping_address: form.address,
        city: form.city,
        district: form.district || null,
        notes: form.notes || null,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        total: totalPrice + shippingCost,
        payment_method: "cod",
      }).select().single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name_bn,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast({ title: "অর্ডার সফল!", description: `অর্ডার নম্বর: ${orderNumber}` });
      navigate(`/order-success/${orderNumber}`);
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-foreground">চেকআউট</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">ডেলিভারি তথ্য</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="name">নাম *</Label><Input id="name" value={form.name} onChange={updateField("name")} required /></div>
              <div><Label htmlFor="phone">মোবাইল নম্বর *</Label><Input id="phone" value={form.phone} onChange={updateField("phone")} required placeholder="01XXXXXXXXX" /></div>
              <div><Label htmlFor="email">ইমেইল</Label><Input id="email" type="email" value={form.email} onChange={updateField("email")} /></div>
              <div><Label htmlFor="city">শহর *</Label><Input id="city" value={form.city} onChange={updateField("city")} required /></div>
              <div><Label htmlFor="district">জেলা</Label><Input id="district" value={form.district} onChange={updateField("district")} /></div>
            </div>
            <div className="mt-4"><Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label><Textarea id="address" value={form.address} onChange={updateField("address")} required /></div>
            <div className="mt-4"><Label htmlFor="notes">বিশেষ নোট</Label><Textarea id="notes" value={form.notes} onChange={updateField("notes")} placeholder="অর্ডার সম্পর্কে কিছু জানাতে চাইলে লিখুন..." /></div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">পেমেন্ট পদ্ধতি</h2>
            <div className="flex items-center gap-3 rounded-lg border-2 border-primary p-4">
              <div className="h-4 w-4 rounded-full border-4 border-primary" />
              <div>
                <p className="font-medium text-foreground">ক্যাশ অন ডেলিভারি</p>
                <p className="text-sm text-muted-foreground">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 self-start">
          <h3 className="mb-4 text-lg font-semibold">অর্ডার সামারি</h3>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name_bn} × {item.quantity}</span>
                <span>৳{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>৳{totalPrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span>{shippingCost === 0 ? "ফ্রি" : `৳${shippingCost}`}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold text-base"><span>মোট</span><span className="text-primary">৳{totalPrice + shippingCost}</span></div>
          </div>
          <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />প্রসেসিং...</> : "অর্ডার কনফার্ম করুন"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
