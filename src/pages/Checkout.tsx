import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Phone, User, Mail, FileText, AlertCircle, Lock, Shield, Eye, EyeOff, Plus, Home, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";
import { getGuestAuthEmail, getGuestAuthEmailCandidates, getGuestAuthPassword } from "@/lib/guest-auth";

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  email: string | null;
  division: string;
  district: string;
  upazila: string;
  address: string;
  is_default: boolean;
}

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

async function generateOrderNumber(): Promise<string> {
  const { count } = await supabase
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
  const [showPin, setShowPin] = useState(false);
  const [abandonedId, setAbandonedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    division: "",
    district: "",
    upazila: "",
    notes: "",
    pin: "",
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

  // Save abandoned checkout data when user fills fields
  const saveAbandonedCheckout = useCallback(async () => {
    // Only save if at least name or phone is filled
    if (!form.name.trim() && !form.phone.trim()) return;

    const payload = {
      customer_name: form.name.trim() || null,
      customer_phone: form.phone.trim() || null,
      customer_email: form.email.trim() || null,
      division: form.division || null,
      district: form.district || null,
      upazila: form.upazila || null,
      shipping_address: form.address.trim() || null,
      cart_items: items.map(i => ({ id: i.id, name: i.name_bn, qty: i.quantity, price: i.price })),
      cart_total: totalPrice,
      user_id: user?.id || null,
    };

    try {
      if (abandonedId) {
        await supabase.from("abandoned_checkouts").update(payload).eq("id", abandonedId);
      } else {
        const { data } = await supabase.from("abandoned_checkouts").insert(payload).select("id").single();
        if (data) setAbandonedId(data.id);
      }
    } catch {
      // silently fail - don't disrupt checkout
    }
  }, [form, items, totalPrice, user, abandonedId]);

  useEffect(() => {
    if (!form.name.trim() && !form.phone.trim()) return;
    const timer = setTimeout(() => { saveAbandonedCheckout(); }, 3000);
    return () => clearTimeout(timer);
  }, [
    form.name,
    form.phone,
    form.email,
    form.division,
    form.district,
    form.upazila,
    form.address,
    saveAbandonedCheckout,
  ]);

  // Save on page leave
  useEffect(() => {
    const handleBeforeUnload = () => { saveAbandonedCheckout(); };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveAbandonedCheckout]);

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
    // PIN required only if user is not already logged in
    if (!user && !/^\d{4}$/.test(form.pin)) errs.pin = "৪ ডিজিটের PIN দিন";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Ensure user is signed in: fast sign-in first, otherwise create guest account server-side and sign in instantly
  const ensureAccount = async (phone: string, pin: string, name: string, email: string): Promise<string | null> => {
    if (user) return user.id;

    const syntheticEmail = getGuestAuthEmail(phone);
    const password = getGuestAuthPassword(pin);

    for (const emailCandidate of getGuestAuthEmailCandidates(phone)) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailCandidate,
        password,
      });

      if (signInData.user) {
        return signInData.user.id;
      }

      if (signInError && !signInError.message.toLowerCase().includes("invalid")) {
        throw signInError;
      }
    }

    const { data: createData, error: createError } = await supabase.functions.invoke("guest-auth", {
      body: {
        phone,
        pin,
        name,
        email: email || null,
      },
    });

    if (createError) {
      throw createError;
    }

    if (createData?.error) {
      throw new Error(createData.error);
    }

    const finalSignInResult = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });

    if (finalSignInResult.data.user) {
      return finalSignInResult.data.user.id;
    }

    throw finalSignInResult.error || new Error("অ্যাকাউন্টে স্বয়ংক্রিয় লগইন করতে সমস্যা হয়েছে");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;

    setLoading(true);
    try {
      // Step 1: Ensure user has an account (auto-create or sign in if needed)
      const userId = await ensureAccount(
        form.phone.trim(),
        form.pin,
        form.name.trim(),
        form.email.trim()
      );

      // Step 2: Create order
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
        user_id: userId,
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

      await Promise.allSettled([
        userId
          ? supabase.from("profiles").upsert(
              {
                user_id: userId,
                full_name: form.name.trim(),
                phone: form.phone.trim(),
                default_division: form.division,
                default_district: form.district,
                default_upazila: form.upazila,
                default_address: form.address.trim(),
              },
              { onConflict: "user_id" }
            )
          : Promise.resolve(),
        abandonedId
          ? supabase.from("abandoned_checkouts").update({ recovered: true }).eq("id", abandonedId)
          : Promise.resolve(),
      ]);

      clearCart();
      toast({ title: "অর্ডার সফল!", description: `অর্ডার নম্বর: ${orderNumber}` });
      navigate(`/order-success/${orderNumber}`);
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "অর্ডার করতে সমস্যা হয়েছে", variant: "destructive" });
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

  // Wait for auth check (no gate — guests can checkout)
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  function FieldError({ field }: { field: string }) {
    return errors[field] ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-foreground">চেকআউট</h1>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-5 text-xl sm:text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              ব্যক্তিগত তথ্য
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Label htmlFor="name" className="text-base font-semibold flex items-center gap-1.5 mb-1.5">
                  <User className="h-4 w-4" />নাম *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="আপনার সম্পূর্ণ নাম"
                  className={`h-10 ${errors.name ? "border-destructive" : ""}`}
                />
                <FieldError field="name" />
              </div>
              <div className="lg:col-span-1">
                <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-1.5 mb-1.5">
                  <Phone className="h-4 w-4" />মোবাইল নম্বর *
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
                  className={`h-10 ${errors.phone ? "border-destructive" : ""}`}
                />
                <FieldError field="phone" />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="email" className="text-base font-semibold flex items-center gap-1.5 mb-1.5">
                  <Mail className="h-4 w-4" />ইমেইল <span className="text-xs font-normal text-muted-foreground">(ঐচ্ছিক)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  className={`h-10 ${errors.email ? "border-destructive" : ""}`}
                />
                <FieldError field="email" />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-5 text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              ডেলিভারি ঠিকানা
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Division */}
              <div>
                <Label className="text-base font-semibold mb-1.5 block">বিভাগ *</Label>
                <Select
                  value={form.division}
                  onValueChange={(v) => setForm({ ...form, division: v, district: "", upazila: "" })}
                >
                  <SelectTrigger className={`h-10 ${errors.division ? "border-destructive" : ""}`}>
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
                <Label className="text-base font-semibold mb-1.5 block">জেলা *</Label>
                <Select
                  value={form.district}
                  onValueChange={(v) => setForm({ ...form, district: v, upazila: "" })}
                  disabled={!form.division}
                >
                  <SelectTrigger className={`h-10 ${errors.district ? "border-destructive" : ""}`}>
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
                <Label className="text-base font-semibold mb-1.5 block">উপজেলা *</Label>
                <Select
                  value={form.upazila}
                  onValueChange={(v) => setForm({ ...form, upazila: v })}
                  disabled={!form.district}
                >
                  <SelectTrigger className={`h-10 ${errors.upazila ? "border-destructive" : ""}`}>
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
              <Label htmlFor="address" className="text-base font-semibold flex items-center gap-1.5 mb-1.5">
                <FileText className="h-4 w-4" />সম্পূর্ণ ঠিকানা *
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
              <Label htmlFor="notes" className="text-base font-semibold mb-1.5 block">বিশেষ নোট <span className="text-xs font-normal text-muted-foreground">(ঐচ্ছিক)</span></Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="অর্ডার সম্পর্কে কিছু জানাতে চাইলে লিখুন..."
              />
            </div>
          </div>

          {/* Account PIN - only for guests */}
          {!user && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-6">
              <h2 className="mb-1 text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                একটি ৪-ডিজিটের PIN সেট করুন
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                অর্ডার complete হলে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্ট তৈরি হবে। পরবর্তীতে এই মোবাইল নম্বর ও PIN দিয়ে লগইন করে অর্ডার ট্র্যাক করতে পারবেন।
              </p>
              <div className="max-w-[280px]">
                <Label htmlFor="pin" className="text-base font-semibold flex items-center gap-1.5 mb-1.5">
                  <Lock className="h-4 w-4" />৪ ডিজিটের PIN *
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={form.pin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setForm({ ...form, pin: v });
                    }}
                    placeholder={showPin ? "1234" : "••••"}
                    maxLength={4}
                    className={`h-12 pr-12 text-center text-2xl tracking-[0.6em] font-mono ${errors.pin ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={showPin ? "PIN লুকান" : "PIN দেখুন"}
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError field="pin" />
              </div>
            </div>
          )}

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
