import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Search,
  Loader2,
  Pencil,
  Save,
  KeyRound,
  Clock,
  ShoppingBag,
  Package,
  Percent,
  Pause,
  Play,
  Activity,
  ShieldCheck,
  Globe,
  Plus,
  Eye,
  EyeOff,
  Copy,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ReceiptText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  owner_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string;
  account_password?: string | null;
  facebook_url: string | null;
  division: string;
  district: string;
  upazila: string;
  address: string;
  status: string;
  commission_percent: number;
  total_orders: number;
  total_revenue: number;
  total_commission_earned: number;
  approved_at: string | null;
  created_at: string;
}

interface VendorActivity {
  auth: {
    email?: string;
    phone?: string;
    last_sign_in_at?: string | null;
    created_at?: string | null;
    email_confirmed_at?: string | null;
    provider?: string;
    providers?: string[];
    raw_user_meta_data?: any;
  } | null;
  products_count: number;
  orders_count: number;
  last_order_at: string | null;
}

interface VendorOrderRow {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
  commission_amount: number;
  vendor_payout_amount: number;
  created_at: string;
  order?: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    payment_method: string;
    created_at: string;
  };
}

interface VendorProductRow {
  id: string;
  name: string;
  name_bn: string;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  category?: { name_bn: string } | null;
}

interface VendorPayoutRow {
  id: string;
  amount: number;
  status: string;
  method: string;
  payout_account: string | null;
  transaction_ref: string | null;
  requested_at: string;
  processed_at: string | null;
}

const fmtDate = (s?: string | null) =>
  !s ? "—" : new Date(s).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });

const copyToClipboard = (text: string, label: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast({
    title: "কপি সম্পন্ন",
    description: `${label} ক্লিপবোর্ডে কপি করা হয়েছে।`,
  });
};

const AdminVendorManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeVendorId = searchParams.get("vendor");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Vendor Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newVendor, setNewVendor] = useState({
    shop_name: "",
    shop_name_bn: "",
    shop_slug: "",
    owner_name: "",
    phone: "",
    whatsapp_number: "",
    email: "",
    password: "",
    commission_percent: 10,
    division: "রাজশাহী",
    district: "নওগাঁ",
    upazila: "সাপাহার",
    address: "",
    description: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit Vendor Modal state
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Password Update Modal state
  const [pwdModalVendor, setPwdModalVendor] = useState<Vendor | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Full Profile View state
  const [profileVendor, setProfileVendor] = useState<Vendor | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activity, setActivity] = useState<VendorActivity | null>(null);
  const [vendorOrders, setVendorOrders] = useState<VendorOrderRow[]>([]);
  const [vendorProducts, setVendorProducts] = useState<VendorProductRow[]>([]);
  const [vendorPayouts, setVendorPayouts] = useState<VendorPayoutRow[]>([]);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Load vendors list
  const loadVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendors" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "লোড ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      setVendors((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // When activeVendorId changes or on load, load full profile
  useEffect(() => {
    if (activeVendorId && vendors.length > 0) {
      const found = vendors.find((v) => v.id === activeVendorId);
      if (found) {
        loadVendorFullProfile(found);
      }
    } else if (!activeVendorId) {
      setProfileVendor(null);
    }
  }, [activeVendorId, vendors]);

  const loadVendorFullProfile = async (v: Vendor) => {
    setProfileVendor(v);
    setProfileLoading(true);

    try {
      // 1. Activity & Auth
      const { data: actData } = await (supabase as any).rpc("admin_get_vendor_activity", {
        _vendor_id: v.id,
      });
      setActivity(actData as VendorActivity);

      // 2. Vendor Orders from order_items
      const { data: ordData } = await supabase
        .from("order_items" as any)
        .select(`
          id, order_id, product_name, quantity, price, commission_amount, vendor_payout_amount, created_at,
          order:order_id(order_number, customer_name, customer_phone, status, payment_method, created_at)
        `)
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setVendorOrders((ordData as any) || []);

      // 3. Vendor Products
      const { data: prodData } = await supabase
        .from("products" as any)
        .select("id, name, name_bn, price, discount_price, stock, image_url, is_active, category:category_id(name_bn)")
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false });
      setVendorProducts((prodData as any) || []);

      // 4. Vendor Payouts
      const { data: payoutData } = await supabase
        .from("vendor_payouts" as any)
        .select("*")
        .eq("vendor_id", v.id)
        .order("requested_at", { ascending: false });
      setVendorPayouts((payoutData as any) || []);
    } catch (err) {
      console.error("Error loading vendor profile details", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Open full profile
  const handleOpenProfile = (v: Vendor) => {
    setSearchParams({ vendor: v.id });
    loadVendorFullProfile(v);
  };

  // Back to list
  const handleBackToList = () => {
    setSearchParams({});
    setProfileVendor(null);
  };

  // Generate random safe password
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Create Vendor Submit
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.email || !newVendor.password || !newVendor.shop_name || !newVendor.owner_name) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "দোকানের নাম, মালিকের নাম, ইমেইল ও পাসওয়ার্ড পূরণ করুন।",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const slug =
        newVendor.shop_slug.trim() ||
        newVendor.shop_name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") ||
        `vendor-${Date.now()}`;

      // Call dedicated edge function using official GoTrue Admin API
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("admin-vendor-auth", {
        body: {
          action: "create_vendor",
          email: newVendor.email.trim(),
          password: newVendor.password.trim(),
          shop_name: newVendor.shop_name.trim(),
          shop_name_bn: newVendor.shop_name_bn.trim() || newVendor.shop_name.trim(),
          shop_slug: slug,
          owner_name: newVendor.owner_name.trim(),
          phone: newVendor.phone.trim(),
          commission_percent: Number(newVendor.commission_percent) || 10,
          division: newVendor.division,
          district: newVendor.district,
          upazila: newVendor.upazila,
          address: newVendor.address.trim(),
          description: newVendor.description.trim(),
        },
      });

      if (fnErr || fnData?.error) {
        // Fallback to database RPC
        const { error: rpcErr } = await (supabase as any).rpc("admin_create_vendor", {
          _shop_name: newVendor.shop_name.trim(),
          _shop_name_bn: newVendor.shop_name_bn.trim() || newVendor.shop_name.trim(),
          _shop_slug: slug,
          _owner_name: newVendor.owner_name.trim(),
          _phone: newVendor.phone.trim(),
          _email: newVendor.email.trim(),
          _password: newVendor.password.trim(),
          _commission_percent: Number(newVendor.commission_percent) || 10,
          _division: newVendor.division,
          _district: newVendor.district,
          _upazila: newVendor.upazila,
          _address: newVendor.address.trim(),
          _description: newVendor.description.trim(),
        });

        if (rpcErr) throw new Error(fnData?.error || rpcErr.message || fnErr?.message);
      }

      toast({
        title: "ভেন্ডর সফলভাবে তৈরি হয়েছে! 🎉",
        description: `${newVendor.shop_name} অ্যাকাউন্ট তৈরি ও অনুমোদন সম্পন্ন হয়েছে। ভেন্ডর এখন এই ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারবেন।`,
      });

      setCreateOpen(false);
      // Reset form
      setNewVendor({
        shop_name: "",
        shop_name_bn: "",
        shop_slug: "",
        owner_name: "",
        phone: "",
        whatsapp_number: "",
        email: "",
        password: "",
        commission_percent: 10,
        division: "রাজশাহী",
        district: "নওগাঁ",
        upazila: "সাপাহার",
        address: "",
        description: "",
      });

      await loadVendors();
    } catch (err: any) {
      console.error("Create vendor error:", err);
      toast({
        title: "ভেন্ডর তৈরি ব্যর্থ",
        description: err.message || "দয়া করে পুনরায় চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Save Edit Vendor
  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);

    try {
      const payload = {
        shop_name: editing.shop_name,
        shop_name_bn: editing.shop_name_bn,
        owner_name: editing.owner_name,
        phone: editing.phone,
        whatsapp_number: editing.whatsapp_number,
        email: editing.email,
        facebook_url: editing.facebook_url,
        division: editing.division,
        district: editing.district,
        upazila: editing.upazila,
        address: editing.address,
        description: editing.description,
        commission_percent: editing.commission_percent,
      };

      const { error } = await supabase.from("vendors" as any).update(payload).eq("id", editing.id);
      if (error) throw error;

      toast({ title: "সফলভাবে আপডেট হয়েছে!" });
      setEditing(null);
      await loadVendors();
      if (profileVendor?.id === editing.id) {
        setProfileVendor({ ...profileVendor, ...payload });
      }
    } catch (err: any) {
      toast({ title: "সংরক্ষণ ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  // Update Password Submit
  const handleUpdatePassword = async () => {
    if (!pwdModalVendor || !newPasswordValue.trim()) return;
    setSavingPassword(true);

    try {
      // First invoke dedicated edge function to sync with GoTrue auth
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("admin-vendor-auth", {
        body: {
          action: "update_password",
          vendor_id: pwdModalVendor.id,
          new_password: newPasswordValue.trim(),
        },
      });

      if (fnErr || fnData?.error) {
        // Fallback to database RPC
        const { error: rpcErr } = await (supabase as any).rpc("admin_update_vendor_password", {
          _vendor_id: pwdModalVendor.id,
          _new_password: newPasswordValue.trim(),
        });
        if (rpcErr) throw new Error(fnData?.error || rpcErr.message || fnErr?.message);
      }

      toast({
        title: "পাসওয়ার্ড আপডেট সম্পন্ন! ✅",
        description: `${pwdModalVendor.shop_name_bn}-এর জন্য নতুন পাসওয়ার্ড সফলভাবে কার্যকর হয়েছে।`,
      });

      // Update local state
      setVendors((prev) =>
        prev.map((v) => (v.id === pwdModalVendor.id ? { ...v, account_password: newPasswordValue } : v))
      );
      if (profileVendor?.id === pwdModalVendor.id) {
        setProfileVendor({ ...profileVendor, account_password: newPasswordValue });
      }

      setPwdModalVendor(null);
      setNewPasswordValue("");
    } catch (err: any) {
      toast({
        title: "পাসওয়ার্ড আপডেট ব্যর্থ",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Toggle Suspend / Active
  const handleToggleSuspend = async (v: Vendor) => {
    const nextStatus = v.status === "approved" ? "suspended" : "approved";
    const { error } = await supabase.from("vendors" as any).update({ status: nextStatus }).eq("id", v.id);

    if (error) {
      toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: nextStatus === "suspended" ? "দোকান স্থগিত করা হয়েছে" : "দোকান পুনরায় চালু করা হয়েছে",
      });
      await loadVendors();
      if (profileVendor?.id === v.id) {
        setProfileVendor({ ...profileVendor, status: nextStatus });
      }
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async (email: string) => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে",
        description: email,
      });
    }
  };

  // Filtered vendors
  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [v.shop_name_bn, v.shop_name, v.owner_name, v.phone, v.email, v.district].some((x) =>
      x?.toLowerCase().includes(q)
    );
  });

  // Calculate high-level vendor stats
  const totalRevenueAll = useMemo(
    () => vendors.reduce((sum, v) => sum + Number(v.total_revenue || 0), 0),
    [vendors]
  );
  const totalCommissionAll = useMemo(
    () => vendors.reduce((sum, v) => sum + Number(v.total_commission_earned || 0), 0),
    [vendors]
  );

  // -------------------------------------------------------------
  // VIEW: FULL VENDOR PROFILE (যদি কোনো ভেন্ডর সিলেক্ট করা থাকে)
  // -------------------------------------------------------------
  if (profileVendor) {
    const v = profileVendor;
    const netEarning = Number(v.total_revenue || 0) - Number(v.total_commission_earned || 0);
    const totalPaid = vendorPayouts
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const availableBalance = Math.max(0, netEarning - totalPaid);

    return (
      <div className="space-y-6">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2 text-foreground font-semibold hover:bg-muted self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>সকল ভেন্ডর তালিকায় ফিরুন</span>
          </Button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(v)}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" />
              <span>তথ্য সম্পাদনা</span>
            </Button>

            <Button
              variant={v.status === "approved" ? "outline" : "default"}
              size="sm"
              onClick={() => handleToggleSuspend(v)}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              {v.status === "approved" ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-rose-500" />
                  <span>স্থগিত করুন</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-500" />
                  <span>চালু করুন</span>
                </>
              )}
            </Button>

            <a
              href={`/shop/${v.shop_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <span>দোকান দেখুন</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Vendor Header Profile Card */}
        <Card className="rounded-2xl border-border/60 overflow-hidden shadow-xs">
          <div className="h-28 bg-gradient-to-r from-emerald-600/90 via-primary/80 to-amber-500/80 relative" />
          <CardContent className="p-5 sm:p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-card border-4 border-card shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-10 w-10 text-primary" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {v.shop_name_bn}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-semibold",
                        v.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                          : "bg-rose-500/10 text-rose-600 border-rose-300"
                      )}
                    >
                      {v.status === "approved" ? "অনুমোদিত ও সক্রিয়" : "স্থগিত"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.shop_name} · slug: <code className="bg-muted px-1.5 py-0.2 rounded font-mono">/{v.shop_slug}</code>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-muted-foreground">কমিশন রেট</span>
                <p className="text-xl font-extrabold text-primary">{v.commission_percent}%</p>
              </div>
            </div>

            {/* Quick Contact & Address Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>মালিক: <strong className="text-foreground">{v.owner_name}</strong> ({v.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <span>ইমেইল: <strong className="text-foreground">{v.email}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                <span>ঠিকানা: <strong className="text-foreground">{v.upazila}, {v.district}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Credentials & Password Management Card */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-r from-muted/30 to-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                    লগইন অ্যাক্সেস ও পাসওয়ার্ড নিয়ন্ত্রণ
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">ভেন্ডরের লগইন ইমেইল ও পাসওয়ার্ড পরিচালনা</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPwdModalVendor(v);
                  setNewPasswordValue("");
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                <span>নতুন পাসওয়ার্ড সেট করুন</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Box */}
            <div className="p-3.5 rounded-xl bg-background border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">লগইন ইমেইল</span>
                <p className="text-sm font-semibold text-foreground">{v.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(v.email, "ইমেইল")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="ইমেইল কপি করুন"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Password Box */}
            <div className="p-3.5 rounded-xl bg-background border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">বর্তমান পাসওয়ার্ড</span>
                <p className="text-sm font-mono font-bold text-foreground">
                  {v.account_password ? (
                    showProfilePassword ? (
                      v.account_password
                    ) : (
                      "••••••••••••"
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground italic font-normal">
                      পাসওয়ার্ড সংরক্ষিত নেই (নিচে সেট করুন)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {v.account_password && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title={showProfilePassword ? "লুকান" : "দেখুন"}
                    >
                      {showProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(v.account_password || "", "পাসওয়ার্ড")}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="পাসওয়ার্ড কপি করুন"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendResetEmail(v.email)}
                  className="text-[11px] h-8 px-2 text-primary hover:bg-primary/10"
                >
                  রিসেট লিংক পাঠান
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">মোট বিক্রি</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground">
              ৳{Math.round(Number(v.total_revenue || 0)).toLocaleString("bn-BD")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{v.total_orders} টি সম্পন্ন অর্ডার</p>
          </Card>

          <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">প্লাটফর্ম কমিশন ({v.commission_percent}%)</span>
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600">
              ৳{Math.round(Number(v.total_commission_earned || 0)).toLocaleString("bn-BD")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">অ্যাডমিনের কমিশন আয়</p>
          </Card>

          <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">ভেন্ডরের মোট নেট আয়</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-blue-600">
              ৳{Math.round(netEarning).toLocaleString("bn-BD")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">কমিশন বাদে মোট প্রাপ্তি</p>
          </Card>

          <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">অবশিষ্ট ব্যালেন্স</span>
              <Banknote className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-primary">
              ৳{Math.round(availableBalance).toLocaleString("bn-BD")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">উত্তোলনযোগ্য বকেয়া</p>
          </Card>
        </div>

        {/* Detailed Tabs: Orders, Products, Payouts, Activities */}
        <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden">
          <Tabs defaultValue="orders" className="w-full">
            <div className="border-b border-border/50 bg-muted/20 px-4 pt-2">
              <TabsList className="bg-transparent h-11 p-0 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
                <TabsTrigger
                  value="orders"
                  className="rounded-t-xl data-[state=active]:bg-card data-[state=active]:shadow-xs text-xs font-semibold px-4"
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  <span>অর্ডারসমূহ ({vendorOrders.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="products"
                  className="rounded-t-xl data-[state=active]:bg-card data-[state=active]:shadow-xs text-xs font-semibold px-4"
                >
                  <Package className="h-4 w-4 mr-1.5" />
                  <span>পণ্য তালিকা ({vendorProducts.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="payouts"
                  className="rounded-t-xl data-[state=active]:bg-card data-[state=active]:shadow-xs text-xs font-semibold px-4"
                >
                  <Banknote className="h-4 w-4 mr-1.5" />
                  <span>উত্তোলন হিস্টোরি ({vendorPayouts.length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="activity"
                  className="rounded-t-xl data-[state=active]:bg-card data-[state=active]:shadow-xs text-xs font-semibold px-4"
                >
                  <Activity className="h-4 w-4 mr-1.5" />
                  <span>অ্যাক্টিভিটি ও লগইন</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Orders Tab */}
            <TabsContent value="orders" className="p-4 sm:p-5 m-0">
              {profileLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  অর্ডার তালিকা লোড হচ্ছে...
                </div>
              ) : vendorOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  এই ভেন্ডরের কোনো পণ্য এখনও অর্ডার হয়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[10px] border-b border-border/50">
                      <tr>
                        <th className="py-2.5 px-3">অর্ডার #</th>
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3">গ্রাহক</th>
                        <th className="py-2.5 px-3">পণ্যের নাম</th>
                        <th className="py-2.5 px-3 text-right">মূল্য</th>
                        <th className="py-2.5 px-3 text-right">কমিশন</th>
                        <th className="py-2.5 px-3 text-right">ভেন্ডর নেট</th>
                        <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {vendorOrders.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            #{item.order?.order_number || item.order_id.slice(0, 6)}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString("bn-BD")}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-foreground">{item.order?.customer_name || "গ্রাহক"}</p>
                            <p className="text-[10px] text-muted-foreground">{item.order?.customer_phone}</p>
                          </td>
                          <td className="py-3 px-3 max-w-[200px] truncate" title={item.product_name}>
                            {item.product_name} <span className="text-muted-foreground">× {item.quantity}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold">
                            ৳{Math.round(Number(item.price || 0) * (item.quantity || 1)).toLocaleString("bn-BD")}
                          </td>
                          <td className="py-3 px-3 text-right text-amber-600 font-medium">
                            ৳{Math.round(Number(item.commission_amount || 0)).toLocaleString("bn-BD")}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            ৳{Math.round(Number(item.vendor_payout_amount || 0)).toLocaleString("bn-BD")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground">
                              {item.order?.status || "pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="p-4 sm:p-5 m-0">
              {vendorProducts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  এই ভেন্ডরের কোনো পণ্য তালিকায় নেই।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vendorProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-border/50 bg-background flex items-center gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name_bn || p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.category?.name_bn || "ক্যাটাগরি"} · স্টক: {p.stock} টি
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-bold text-primary">
                            ৳{(p.discount_price || p.price).toLocaleString("bn-BD")}
                          </span>
                          {p.discount_price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              ৳{p.price.toLocaleString("bn-BD")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts" className="p-4 sm:p-5 m-0">
              {vendorPayouts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  কোনো উত্তোলন অনুরোধ রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-2">
                  {vendorPayouts.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 rounded-xl border border-border/50 bg-background flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">
                          ৳{Number(pay.amount).toLocaleString("bn-BD")} — {pay.method?.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          হিসাব: {pay.payout_account || "—"} · আবেদন: {fmtDate(pay.requested_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            pay.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                              : pay.status === "rejected"
                              ? "bg-rose-500/10 text-rose-600 border-rose-300"
                              : "bg-amber-500/10 text-amber-600 border-amber-300"
                          )}
                        >
                          {pay.status === "paid" ? "পরিশোধিত" : pay.status === "rejected" ? "বাতিল" : "অপেক্ষমাণ"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity & Logins Tab */}
            <TabsContent value="activity" className="p-4 sm:p-5 m-0">
              {!activity ? (
                <div className="py-10 text-center text-muted-foreground text-xs">অ্যাক্টিভিটি লোড হচ্ছে...</div>
              ) : (
                <div className="space-y-2 border border-border/50 rounded-xl divide-y divide-border/40 text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground">লগইন ইমেইল</span>
                    <span className="font-semibold text-foreground">{activity.auth?.email || v.email}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground">সর্বশেষ সাইন-ইন / লগইন</span>
                    <span className="font-semibold text-primary">{fmtDate(activity.auth?.last_sign_in_at)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground">অ্যাকাউন্ট তৈরি</span>
                    <span className="font-medium text-foreground">{fmtDate(activity.auth?.created_at || v.created_at)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground">অ্যাডমিন অনুমোদন তারিখ</span>
                    <span className="font-medium text-foreground">{fmtDate(v.approved_at)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-muted-foreground">সর্বশেষ অর্ডার তারিখ</span>
                    <span className="font-medium text-foreground">{fmtDate(activity.last_order_at)}</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN VENDORS LIST VIEW (ডিফল্ট তালিকা)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ভেন্ডর ম্যানেজমেন্ট
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            অনুমোদিত বিক্রেতা নিয়ন্ত্রণ, কমিশন রেট ও অ্যাক্টিভিটি পর্যবেক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="দোকান, মালিক, ফোন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-xs bg-card"
            />
          </div>

          <Button
            onClick={() => {
              setNewVendor({
                ...newVendor,
                password: generateRandomPassword(),
              });
              setCreateOpen(true);
            }}
            className="rounded-xl text-xs font-bold gap-1.5 shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ভেন্ডর যুক্ত করুন</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">মোট ভেন্ডর</span>
            <Store className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
          <p className="text-[10px] text-muted-foreground">নিবন্ধিত অনুমোদিত দোকান</p>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">সক্রিয় ভেন্ডর</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {vendors.filter((v) => v.status === "approved").length}
          </p>
          <p className="text-[10px] text-muted-foreground">স্থগিত: {vendors.filter((v) => v.status === "suspended").length} টি</p>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">মোট বিক্রি</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            ৳{Math.round(totalRevenueAll).toLocaleString("bn-BD")}
          </p>
          <p className="text-[10px] text-muted-foreground">ভেন্ডরদের মোট ডেলিভারড সেল</p>
        </Card>

        <Card className="rounded-2xl border-border/60 p-4 bg-card shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">প্ল্যাটফর্ম কমিশন আয়</span>
            <Percent className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">
            ৳{Math.round(totalCommissionAll).toLocaleString("bn-BD")}
          </p>
          <p className="text-[10px] text-muted-foreground">কমিশন থেকে অর্জিত আয়</p>
        </Card>
      </div>

      {/* Vendors Cards Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground">ভেন্ডর তথ্য লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            কোনো ভেন্ডর পাওয়া যায়নি
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Card
              key={v.id}
              className="rounded-2xl border-border/60 bg-card hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                {/* Header: Avatar + Name (NO underline, NO color change on click) */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => handleOpenProfile(v)}
                    className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0 cursor-pointer border border-border/60 shadow-2xs hover:scale-105 transition-transform"
                    title="প্রোফাইল দেখুন"
                  >
                    {v.logo_url ? (
                      <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* The name MUST NOT change color and MUST NOT have underlines */}
                    <div
                      onClick={() => handleOpenProfile(v)}
                      role="button"
                      tabIndex={0}
                      className="text-foreground font-bold text-base truncate cursor-pointer select-none no-underline hover:no-underline"
                      title="সম্পূর্ণ প্রোফাইল দেখুন"
                    >
                      {v.shop_name_bn}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">/{v.shop_slug}</p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-semibold",
                          v.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                            : "bg-rose-500/10 text-rose-600 border-rose-300"
                        )}
                      >
                        {v.status === "approved" ? "অনুমোদিত" : "স্থগিত"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">· কমিশন {v.commission_percent}%</span>
                    </div>
                  </div>
                </div>

                {/* Owner & Contacts */}
                <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-border/40">
                  <p className="text-foreground font-medium flex items-center gap-1.5 truncate">
                    <span>মালিক: {v.owner_name}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span>{v.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span>{v.upazila}, {v.district}</span>
                  </p>
                </div>

                {/* Credentials Preview Strip */}
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ইমেইল:</span>
                    <div className="flex items-center gap-1 font-semibold text-foreground truncate max-w-[170px]">
                      <span className="truncate">{v.email}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(v.email, "ইমেইল")}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">পাসওয়ার্ড:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                      <span>{v.account_password || "••••••••"}</span>
                      {v.account_password && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(v.account_password || "", "পাসওয়ার্ড")}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPwdModalVendor(v);
                          setNewPasswordValue("");
                        }}
                        className="text-[10px] text-primary hover:underline ml-1"
                      >
                        পরিবর্তন
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sales Snapshot */}
                <div className="flex items-center justify-between text-xs bg-primary/5 rounded-xl p-2 px-3">
                  <span>মোট বিক্রি: <strong>৳{Math.round(Number(v.total_revenue || 0)).toLocaleString("bn-BD")}</strong></span>
                  <span>{v.total_orders} টি অর্ডার</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full text-xs font-semibold rounded-xl"
                    onClick={() => handleOpenProfile(v)}
                  >
                    প্রোফাইল দেখুন
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold rounded-xl"
                    onClick={() => setEditing(v)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    ম্যানেজ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* ➕ MODAL: নতুন ভেন্ডর যুক্ত করুন (CREATE NEW VENDOR) */}
      {/* ============================================================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              <span>নতুন ভেন্ডর অ্যাকাউন্ট তৈরি করুন</span>
            </DialogTitle>
            <DialogDescription>
              দোকানের বিবরণ ও লগইন ক্রেডেনশিয়াল প্রদান করে সরাসরি ভেন্ডর যোগ করুন
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVendor} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs font-semibold">দোকানের নাম (বাংলা) *</Label>
                <Input
                  required
                  placeholder="যেমন: মেসার্স এগ্রো ফার্ম"
                  value={newVendor.shop_name_bn}
                  onChange={(e) => setNewVendor({ ...newVendor, shop_name_bn: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">দোকানের নাম (English) *</Label>
                <Input
                  required
                  placeholder="যেমন: Agro Farm"
                  value={newVendor.shop_name}
                  onChange={(e) => setNewVendor({ ...newVendor, shop_name: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">মালিকের নাম *</Label>
                <Input
                  required
                  placeholder="যেমন: আব্দুর রহমান"
                  value={newVendor.owner_name}
                  onChange={(e) => setNewVendor({ ...newVendor, owner_name: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">ফোন নম্বর *</Label>
                <Input
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              {/* Login Credentials Section */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>ভেন্ডর লগইন ক্রেডেনশিয়াল (ইমেইল ও পাসওয়ার্ড)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">লগইন ইমেইল *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="vendor@example.com"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                      className="rounded-xl mt-1 text-xs bg-card"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">লগইন পাসওয়ার্ড *</Label>
                      <button
                        type="button"
                        onClick={() => setNewVendor({ ...newVendor, password: generateRandomPassword() })}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        র‍্যান্ডম তৈরি করুন
                      </button>
                    </div>

                    <div className="relative mt-1">
                      <Input
                        required
                        type={showNewPassword ? "text" : "password"}
                        placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                        value={newVendor.password}
                        onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                        className="rounded-xl text-xs pr-9 bg-card"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">কমিশন রেট (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newVendor.commission_percent}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, commission_percent: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">কাস্টম শপ স্লাগ (ঐচ্ছিক)</Label>
                <Input
                  placeholder="যেমন: my-shop (ফাঁকা রাখলে অটো হবে)"
                  value={newVendor.shop_slug}
                  onChange={(e) => setNewVendor({ ...newVendor, shop_slug: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">জেলা</Label>
                <Input
                  value={newVendor.district}
                  onChange={(e) => setNewVendor({ ...newVendor, district: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">উপজেলা</Label>
                <Input
                  value={newVendor.upazila}
                  onChange={(e) => setNewVendor({ ...newVendor, upazila: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">বিস্তারিত ঠিকানা</Label>
                <Input
                  placeholder="বাজারের নাম, গ্রাম, পোস্ট ইত্যাদি"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">দোকানের সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</Label>
                <Textarea
                  placeholder="দোকান বা ব্যবসা সম্পর্কিত তথ্য..."
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({ ...newVendor, description: e.target.value })}
                  rows={2}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                বাতিল
              </Button>
              <Button type="submit" disabled={creating} className="rounded-xl">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                ভেন্ডর তৈরি করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* ✏️ MODAL: ভেন্ডর সম্পাদনা (EDIT VENDOR DIALOG) */}
      {/* ============================================================== */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" />
                  <span>{editing.shop_name_bn} — সম্পাদনা</span>
                </DialogTitle>
                <DialogDescription>দোকানের বিস্তারিত তথ্য ও কমিশন রেট আপডেট করুন</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <Label className="text-xs">দোকানের নাম (বাংলা)</Label>
                  <Input
                    value={editing.shop_name_bn || ""}
                    onChange={(e) => setEditing({ ...editing, shop_name_bn: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">দোকানের নাম (English)</Label>
                  <Input
                    value={editing.shop_name || ""}
                    onChange={(e) => setEditing({ ...editing, shop_name: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">মালিকের নাম</Label>
                  <Input
                    value={editing.owner_name || ""}
                    onChange={(e) => setEditing({ ...editing, owner_name: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">ফোন নম্বর</Label>
                  <Input
                    value={editing.phone || ""}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">ইমেইল</Label>
                  <Input
                    value={editing.email || ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">কমিশন (%)</Label>
                  <Input
                    type="number"
                    value={String(editing.commission_percent ?? 10)}
                    onChange={(e) =>
                      setEditing({ ...editing, commission_percent: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">জেলা</Label>
                  <Input
                    value={editing.district || ""}
                    onChange={(e) => setEditing({ ...editing, district: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">উপজেলা</Label>
                  <Input
                    value={editing.upazila || ""}
                    onChange={(e) => setEditing({ ...editing, upazila: e.target.value })}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs">ঠিকানা</Label>
                  <Textarea
                    value={editing.address || ""}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    rows={2}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs">বিবরণ</Label>
                  <Textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={2}
                    className="rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
                  বাতিল
                </Button>
                <Button onClick={handleSaveEdit} disabled={savingEdit} className="rounded-xl">
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 🔐 MODAL: পাসওয়ার্ড পরিবর্তন (UPDATE VENDOR PASSWORD) */}
      {/* ============================================================== */}
      <Dialog open={!!pwdModalVendor} onOpenChange={(o) => !o && setPwdModalVendor(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {pwdModalVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                </DialogTitle>
                <DialogDescription>
                  <strong>{pwdModalVendor.shop_name_bn}</strong> ({pwdModalVendor.email})-এর জন্য নতুন পাসওয়ার্ড সেট করুন
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-semibold">নতুন পাসওয়ার্ড</Label>
                    <button
                      type="button"
                      onClick={() => setNewPasswordValue(generateRandomPassword())}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      র‍্যান্ডম তৈরি করুন
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="নতুন পাসওয়ার্ড লিখুন..."
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="rounded-xl font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    পাসওয়ার্ড পরিবর্তন করার সাথে সাথে ডাটাবেজ ও Auth সিস্টেমে আপডেট হবে এবং ভেন্ডর এই নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবে।
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setPwdModalVendor(null)} disabled={savingPassword}>
                  বাতিল
                </Button>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={savingPassword || !newPasswordValue.trim()}
                  className="rounded-xl"
                >
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  পাসওয়ার্ড সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendorManagement;
