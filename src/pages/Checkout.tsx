import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Phone, User, Mail, FileText, AlertCircle, LogIn } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

async function generateOrderNumber(): Promise<string> {
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const nextNum = (count || 0) + 1;
  return `SM-${String(nextNum).padStart(4, "0")}`;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    division: "",
    district: "",
    upazila: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
        email: prev.email || user?.email || "",
        division: prev.division || profile.default_division || "",
        district: prev.district || profile.default_district || "",
        upazila: prev.upazila || profile.default_upazila || "",
        address: prev.address || profile.default_address || "",
      }));
    }
  }, [profile, user]);

  const shippingCost = totalPrice >= 2000 ? 0 : 120;

  // Cascading location data
  const selectedDivision = useMemo(
    () => divisions.find((d) => d.name === form.division),
    [form.division]
  );
  const selectedDistrict = useMemo(
    () => selectedDivision?.districts.find((d) => d.name === form.district),
    [selectedDivision, form.district]
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = "সম্পূর্ণ নাম লিখুন (কমপক্ষে ৩ অক্ষর)";
    if (!BD_PHONE_REGEX.test(form.phone)) errs.phone = "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "সঠিক ইমেইল দিন";
    if (!form.division) errs.division = "বিভাগ সিলেক্ট করুন";
    if (!form.district) errs.district = "জেলা সিলেক্ট করুন";
    if (!form.upazila) errs.upazila = "উপজেলা সিলেক্ট করুন";
    if (!form.address.trim() || form.address.trim().length < 10) errs.address = "সম্পূর্ণ ঠিকানা লিখুন (কমপক্ষে ১০ অক্ষর)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const orderNumber = await generateOrderNumber();
      const divBn = selectedDivision?.name_bn || "";
      const distBn = selectedDistrict?.name_bn || "";
      const upzBn = selectedDistrict?.upazilas.find((u) => u.name === form.upazila)?.name_bn || "";
      const cityLabel = `${upzBn}, ${distBn}, ${divBn}`;

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        shipping_address: form.address.trim(),
        city: cityLabel,
        district: form.district,
        notes: form.notes.trim() || null,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        total: totalPrice + shippingCost,
        payment_method: "cod",
        user_id: user?.id || null,
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

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  // Auth gate - require login to checkout
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <LogIn className="h-16 w-16 text-primary/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">অর্ডার করতে লগইন করুন</h2>
        <p className="text-muted-foreground mb-6">অর্ডার কনফার্ম করতে এবং আপনার অর্ডার ট্র্যাক করতে লগইন প্রয়োজন</p>
        <Button asChild size="lg" className="gap-2">
          <Link to="/login" state={{ from: "/checkout" }}>
            <LogIn className="h-5 w-5" />
            লগইন করুন
          </Link>
        </Button>
      </div>
    );
  }

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-foreground">চেকআউট</h1>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              ব্যক্তিগত তথ্য
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />নাম *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="আপনার সম্পূর্ণ নাম"
                  className={errors.name ? "border-destructive" : ""}
                />
                <FieldError field="name" />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />মোবাইল নম্বর *
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
                    setForm({ ...form, phone: v });
                  }}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  className={errors.phone ? "border-destructive" : ""}
                />
                <FieldError field="phone" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />ইমেইল (ঐচ্ছিক)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                <FieldError field="email" />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              ডেলিভারি ঠিকানা
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Division */}
              <div>
                <Label>বিভাগ *</Label>
                <Select
                  value={form.division}
                  onValueChange={(v) => setForm({ ...form, division: v, district: "", upazila: "" })}
                >
                  <SelectTrigger className={errors.division ? "border-destructive" : ""}>
                    <SelectValue placeholder="বিভাগ সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="division" />
              </div>

              {/* District */}
              <div>
                <Label>জেলা *</Label>
                <Select
                  value={form.district}
                  onValueChange={(v) => setForm({ ...form, district: v, upazila: "" })}
                  disabled={!form.division}
                >
                  <SelectTrigger className={errors.district ? "border-destructive" : ""}>
                    <SelectValue placeholder="জেলা সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDivision?.districts.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="district" />
              </div>

              {/* Upazila */}
              <div>
                <Label>উপজেলা *</Label>
                <Select
                  value={form.upazila}
                  onValueChange={(v) => setForm({ ...form, upazila: v })}
                  disabled={!form.district}
                >
                  <SelectTrigger className={errors.upazila ? "border-destructive" : ""}>
                    <SelectValue placeholder="উপজেলা সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDistrict?.upazilas.map((u) => (
                      <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="upazila" />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="address" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />সম্পূর্ণ ঠিকানা *
              </Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="বাড়ি নং, রোড, এলাকা, পোস্ট অফিস..."
                className={errors.address ? "border-destructive" : ""}
              />
              <FieldError field="address" />
            </div>

            <div className="mt-4">
              <Label htmlFor="notes">বিশেষ নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="অর্ডার সম্পর্কে কিছু জানাতে চাইলে লিখুন..."
              />
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
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

        {/* Order Summary */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 self-start sticky top-4">
          <h3 className="mb-4 text-lg font-semibold">অর্ডার সামারি</h3>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="flex-1 min-w-0 truncate mr-2">{item.name_bn} × {item.quantity}</span>
                <span className="flex-shrink-0">৳{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">সাবটোটাল</span>
              <span>৳{totalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ডেলিভারি</span>
              <span>{shippingCost === 0 ? "ফ্রি" : `৳${shippingCost}`}</span>
            </div>
            {shippingCost > 0 && (
              <p className="text-xs text-muted-foreground">৳২,০০০+ অর্ডারে ফ্রি ডেলিভারি</p>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold text-base">
              <span>মোট</span>
              <span className="text-primary">৳{totalPrice + shippingCost}</span>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />প্রসেসিং...</>
            ) : (
              "অর্ডার কনফার্ম করুন"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
