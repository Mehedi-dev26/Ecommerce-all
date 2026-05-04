import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import {
  Loader2, Package, Clock, CheckCircle, Truck, XCircle, User,
  ShoppingBag, LogOut, MapPin, Phone as PhoneIcon, Pencil, X,
  Calendar, CreditCard, RefreshCw, ChevronRight, Eye,
  RotateCcw, HelpCircle, Shield, Bell, Copy, ExternalLink,
  Search, ArrowRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  city: string;
  payment_method: string;
  shipping_address: string;
  district: string | null;
  pathao_consignment_id: string | null;
  pathao_order_status: string | null;
  pathao_tracking_url: string | null;
  delivery_fee: number | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  product_id: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "অপেক্ষমান", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800" },
  confirmed: { label: "কনফার্মড", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800" },
  processing: { label: "প্রসেসিং", icon: Package, color: "text-violet-600", bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800" },
  shipped: { label: "শিপড", icon: Truck, color: "text-sky-600", bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/50 dark:border-sky-800" },
  delivered: { label: "ডেলিভার্ড", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800" },
  cancelled: { label: "বাতিল", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800" },
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

const UserDashboard = () => {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    default_division: "",
    default_district: "",
    default_upazila: "",
    default_address: "",
  });
  const [saving, setSaving] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);
  const [trackSearchId, setTrackSearchId] = useState("");
  const [trackSearchLoading, setTrackSearchLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackedItems, setTrackedItems] = useState<OrderItem[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/dashboard" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        default_division: profile.default_division || "",
        default_district: profile.default_district || "",
        default_upazila: profile.default_upazila || "",
        default_address: profile.default_address || "",
      });
    }
  }, [profile]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, subtotal, shipping_cost, status, created_at, city, district, payment_method, shipping_address, pathao_consignment_id, pathao_order_status, pathao_tracking_url, delivery_fee")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from("order_items")
      .select("id, product_name, quantity, price, product_id")
      .eq("order_id", orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  const handleReorder = (items: OrderItem[]) => {
    items.forEach((item) => {
      addItem({
        id: item.product_id || item.id,
        name: item.product_name,
        name_bn: item.product_name,
        price: Number(item.price),
        image_url: null,
        weight: null,
      }, item.quantity);
    });
    toast({ title: "✅ কার্টে যোগ হয়েছে", description: "আগের অর্ডারের সব পণ্য কার্টে যোগ করা হয়েছে।" });
    navigate("/cart");
  };

  const copyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    toast({ title: "কপি হয়েছে", description: `অর্ডার নম্বর ${orderNumber} কপি করা হয়েছে।` });
  };

  const trackPathaoOrder = async (order: Order) => {
    if (!order.pathao_consignment_id) return;
    setTrackingLoading(order.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        `pathao?action=track-order&consignment_id=${order.pathao_consignment_id}`,
        { method: "GET" }
      );
      if (error) throw error;
      const newStatus = data?.data?.order_status;
      if (newStatus) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, pathao_order_status: newStatus } : o
          )
        );
        toast({ title: "ট্র্যাকিং আপডেট", description: `স্ট্যাটাস: ${newStatus}` });
      }
    } catch (err) {
      console.error("Tracking error:", err);
      toast({ title: "ত্রুটি", description: "ট্র্যাকিং তথ্য পেতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setTrackingLoading(null);
    }
  };

  const searchOrderTracking = async () => {
    if (!trackSearchId.trim()) return;
    setTrackSearchLoading(true);
    setTrackError(null);
    setTrackedOrder(null);
    setTrackedItems([]);
    try {
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("id, order_number, total, subtotal, shipping_cost, status, created_at, city, district, payment_method, shipping_address, pathao_consignment_id, pathao_order_status, pathao_tracking_url, delivery_fee")
        .eq("order_number", trackSearchId.trim().toUpperCase())
        .maybeSingle();

      if (orderErr || !orderData) {
        setTrackError("এই অর্ডার নম্বর দিয়ে কোনো অর্ডার পাওয়া যায়নি।");
        return;
      }

      // If has pathao consignment, fetch live status
      if (orderData.pathao_consignment_id) {
        try {
          const { data: trackData } = await supabase.functions.invoke(
            `pathao?action=track-order&consignment_id=${orderData.pathao_consignment_id}`,
            { method: "GET" }
          );
          if (trackData?.data?.order_status) {
            orderData.pathao_order_status = trackData.data.order_status;
          }
        } catch {
          // use cached status
        }
      }

      setTrackedOrder(orderData as Order);

      const { data: items } = await supabase
        .from("order_items")
        .select("id, product_name, quantity, price, product_id")
        .eq("order_id", orderData.id);
      setTrackedItems(items || []);
    } catch {
      setTrackError("অর্ডার ট্র্যাক করতে সমস্যা হয়েছে।");
    } finally {
      setTrackSearchLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name || null,
          phone: profileForm.phone || null,
          default_division: profileForm.default_division || null,
          default_district: profileForm.default_district || null,
          default_upazila: profileForm.default_upazila || null,
          default_address: profileForm.default_address || null,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      toast({ title: "✅ প্রোফাইল আপডেট হয়েছে" });
      setProfileEditing(false);
      await refreshProfile();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedDivision = divisions.find((d) => d.name === profileForm.default_division);
  const selectedDistrict = selectedDivision?.districts.find((d) => d.name === profileForm.default_district);

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  // Recent activity
  const recentOrder = orders[0];
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long" }) : "";

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <>
    <SEO title="আমার ড্যাশবোর্ড" description="Sapahar Mango Shop ড্যাশবোর্ড — অর্ডার ট্র্যাক, ঠিকানা ও প্রোফাইল ব্যবস্থাপনা।" path="/dashboard" noindex />
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg">
        <div className="h-24 sm:h-32 bg-gradient-to-br from-primary via-primary/85 to-secondary/70" />
        <div className="bg-card border-b border-border/50 px-4 sm:px-6 pb-4 pt-0">
          <div className="flex items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-xl flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {profile?.full_name || user?.user_metadata?.full_name || "ইউজার"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
              {memberSince && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">সদস্য: {memberSince} থেকে</p>
              )}
            </div>
            <div className="hidden sm:flex gap-2 pb-1">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setActiveTab("profile"); setProfileEditing(true); }}>
                <Pencil className="h-3.5 w-3.5" /> এডিট
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5 text-xs" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" /> লগআউট
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Order Alert */}
      {recentOrder && ["pending", "confirmed", "processing", "shipped"].includes(recentOrder.status) && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">সক্রিয় অর্ডার</p>
              <p className="text-xs text-muted-foreground truncate">
                {recentOrder.order_number} — {statusConfig[recentOrder.status]?.label}
              </p>
            </div>
            <Button size="sm" variant="outline" className="flex-shrink-0 gap-1 text-xs" onClick={() => { setActiveTab("orders"); toggleOrderExpand(recentOrder.id); }}>
              <Eye className="h-3.5 w-3.5" /> দেখুন
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {[
          { icon: Package, value: orders.length, label: "মোট অর্ডার", iconColor: "text-primary" },
          { icon: Clock, value: pendingCount, label: "চলমান", iconColor: "text-amber-500" },
          { icon: CheckCircle, value: deliveredCount, label: "ডেলিভার্ড", iconColor: "text-emerald-500" },
          { icon: CreditCard, value: `৳${totalSpent.toLocaleString("bn-BD")}`, label: "মোট খরচ", iconColor: "text-primary" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 overflow-hidden">
            <CardContent className="p-3 sm:p-4 text-center">
              <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor} mx-auto mb-1.5`} />
              <p className={`text-lg sm:text-xl font-bold ${i === 3 ? "text-primary" : "text-foreground"} truncate`}>{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="w-full sm:w-auto h-10">
            <TabsTrigger value="orders" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
              <Package className="h-4 w-4" /> অর্ডার
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
              <Search className="h-4 w-4" /> ট্র্যাকিং
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
              <User className="h-4 w-4" /> প্রোফাইল
            </TabsTrigger>
            <TabsTrigger value="support" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4" /> সাহায্য
            </TabsTrigger>
          </TabsList>

          {activeTab === "orders" && (
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="সব অর্ডার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব অর্ডার ({orders.length})</SelectItem>
                  {Object.entries(statusConfig).map(([key, cfg]) => {
                    const count = orders.filter(o => o.status === key).length;
                    return count > 0 ? (
                      <SelectItem key={key} value={key}>{cfg.label} ({count})</SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={fetchOrders}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-foreground font-semibold text-lg">
                  {statusFilter !== "all" ? "এই ফিল্টারে কোনো অর্ডার নেই" : "এখনো কোনো অর্ডার নেই"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">আজই আপনার পছন্দের পণ্য অর্ডার করুন</p>
                <Button asChild className="mt-5 gap-2">
                  <Link to="/products"><ShoppingBag className="h-4 w-4" /> পণ্য দেখুন</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedOrder === order.id;
                const items = orderItems[order.id];
                const currentStep = getStepIndex(order.status);

                return (
                  <Card key={order.id} className="border-border/50 overflow-hidden transition-shadow hover:shadow-md">
                    {/* Order Header */}
                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="w-full text-left p-3 sm:p-4 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${status.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm">{order.order_number}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                <Badge variant="outline" className={`text-[10px] border ${status.bg} ${status.color}`}>
                                  {status.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(order.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center gap-1">
                              <div>
                                <p className="text-sm sm:text-base font-bold text-primary">৳{Number(order.total).toLocaleString("bn-BD")}</p>
                                <p className="text-[10px] text-muted-foreground">{order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method}</p>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-muted/20 px-3 sm:px-4 py-3 space-y-4">
                        {/* Progress Tracker */}
                        {order.status !== "cancelled" && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">অর্ডার ট্র্যাকিং</p>
                            <div className="flex items-center gap-0">
                              {statusSteps.map((step, i) => {
                                const stepCfg = statusConfig[step];
                                const StepIcon = stepCfg.icon;
                                const isActive = i <= currentStep;
                                return (
                                  <div key={step} className="flex items-center flex-1 last:flex-none">
                                    <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${isActive ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                                      <StepIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                                    </div>
                                    {i < statusSteps.length - 1 && (
                                      <div className={`flex-1 h-0.5 mx-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between mt-1">
                              {statusSteps.map((step) => (
                                <p key={step} className="text-[8px] sm:text-[9px] text-muted-foreground text-center" style={{ width: "20%" }}>
                                  {statusConfig[step].label}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pathao Courier Tracking */}
                        {order.pathao_consignment_id && (
                          <div className="rounded-lg border border-border/50 bg-card p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5" /> পাঠাও কুরিয়ার ট্র্যাকিং
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-[10px]"
                                disabled={trackingLoading === order.id}
                                onClick={() => trackPathaoOrder(order)}
                              >
                                {trackingLoading === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                আপডেট
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Package className="h-3 w-3" />
                                ID: {order.pathao_consignment_id}
                              </Badge>
                              {order.pathao_order_status && (
                                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                  {order.pathao_order_status}
                                </Badge>
                              )}
                            </div>
                            {order.pathao_tracking_url && (
                              <a
                                href={order.pathao_tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" /> পাঠাও ওয়েবসাইটে ট্র্যাক করুন
                              </a>
                            )}
                          </div>
                        )}

                        {order.status === "cancelled" && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">এই অর্ডারটি বাতিল করা হয়েছে</span>
                          </div>
                        )}

                        {/* Order Items */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">পণ্যসমূহ</p>
                          {items ? (
                            <div className="space-y-1.5">
                              {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-card rounded-lg p-2 border border-border/50">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Package className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">{item.product_name}</p>
                                      <p className="text-[10px] text-muted-foreground">{item.quantity} x ৳{Number(item.price).toLocaleString("bn-BD")}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs font-semibold text-foreground flex-shrink-0">
                                    ৳{(item.quantity * Number(item.price)).toLocaleString("bn-BD")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-3">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-card rounded-lg p-3 border border-border/50 space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>সাবটোটাল</span>
                            <span>৳{Number(order.subtotal).toLocaleString("bn-BD")}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>ডেলিভারি চার্জ</span>
                            <span>{Number(order.shipping_cost) === 0 ? "ফ্রি" : `৳${Number(order.shipping_cost).toLocaleString("bn-BD")}`}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm font-bold text-foreground">
                            <span>মোট</span>
                            <span className="text-primary">৳{Number(order.total).toLocaleString("bn-BD")}</span>
                          </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span>{order.shipping_address}{order.district ? `, ${order.district}` : ""}, {order.city}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => copyOrderNumber(order.order_number)}>
                            <Copy className="h-3 w-3" /> কপি নম্বর
                          </Button>
                          {items && items.length > 0 && (
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => handleReorder(items)}>
                              <RotateCcw className="h-3 w-3" /> পুনরায় অর্ডার
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-0">
          <Card className="border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">অর্ডার ট্র্যাকিং</h3>
                <p className="text-sm text-muted-foreground mt-1">আপনার অর্ডার নম্বর দিয়ে রিয়েল-টাইম ট্র্যাকিং দেখুন</p>
              </div>

              {/* Search Input */}
              <div className="flex gap-2 max-w-md mx-auto mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="অর্ডার নম্বর লিখুন (যেমন: SM-0001)"
                    value={trackSearchId}
                    onChange={(e) => setTrackSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchOrderTracking()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={searchOrderTracking} disabled={trackSearchLoading || !trackSearchId.trim()} className="gap-1.5">
                  {trackSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  ট্র্যাক
                </Button>
              </div>

              {/* Error */}
              {trackError && (
                <div className="max-w-md mx-auto mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
                  <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                  <p className="text-sm text-destructive">{trackError}</p>
                </div>
              )}

              {/* Tracked Order Result */}
              {trackedOrder && (
                <div className="max-w-lg mx-auto space-y-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">অর্ডার নম্বর</p>
                      <p className="text-base font-bold text-foreground">{trackedOrder.order_number}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(trackedOrder.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${statusConfig[trackedOrder.status]?.bg || ""} ${statusConfig[trackedOrder.status]?.color || ""} border`}>
                      {statusConfig[trackedOrder.status]?.label || trackedOrder.status}
                    </Badge>
                  </div>

                  {/* Progress Steps */}
                  {trackedOrder.status !== "cancelled" && (
                    <div className="p-4 rounded-xl border border-border/50 bg-card">
                      <p className="text-xs font-medium text-muted-foreground mb-3">ডেলিভারি অগ্রগতি</p>
                      <div className="space-y-0">
                        {statusSteps.map((step, i) => {
                          const stepCfg = statusConfig[step];
                          const StepIcon = stepCfg.icon;
                          const currentIdx = getStepIndex(trackedOrder.status);
                          const isActive = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <div key={step} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent ? "border-primary bg-primary text-primary-foreground scale-110" : isActive ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                                  <StepIcon className={`h-3.5 w-3.5 ${isCurrent ? "text-primary-foreground" : isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                                </div>
                                {i < statusSteps.length - 1 && (
                                  <div className={`w-0.5 h-6 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
                                )}
                              </div>
                              <div className="pt-1">
                                <p className={`text-sm font-medium ${isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                                  {stepCfg.label}
                                </p>
                                {isCurrent && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">বর্তমান অবস্থা</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {trackedOrder.status === "cancelled" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm text-destructive font-medium">এই অর্ডারটি বাতিল করা হয়েছে</span>
                    </div>
                  )}

                  {/* Courier Info (simplified - no separate status) */}
                  {trackedOrder.pathao_consignment_id && trackedOrder.pathao_tracking_url && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>কুরিয়ার ট্র্যাকিং নম্বর: <span className="font-medium text-foreground">{trackedOrder.pathao_consignment_id}</span></span>
                      </div>
                      <a
                        href={trackedOrder.pathao_tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="h-3 w-3" /> বিস্তারিত
                      </a>
                    </div>
                  )}

                  {/* Order Items */}
                  {trackedItems.length > 0 && (
                    <div className="p-4 rounded-xl border border-border/50 bg-card">
                      <p className="text-xs font-medium text-muted-foreground mb-2">পণ্যসমূহ</p>
                      <div className="space-y-1.5">
                        {trackedItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{item.product_name}</p>
                                <p className="text-[10px] text-muted-foreground">{item.quantity} x ৳{Number(item.price).toLocaleString("bn-BD")}</p>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-foreground flex-shrink-0">
                              ৳{(item.quantity * Number(item.price)).toLocaleString("bn-BD")}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm font-bold">
                        <span>মোট</span>
                        <span className="text-primary">৳{Number(trackedOrder.total).toLocaleString("bn-BD")}</span>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/30">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ডেলিভারি ঠিকানা</p>
                      <p className="text-sm text-foreground">{trackedOrder.shipping_address}{trackedOrder.district ? `, ${trackedOrder.district}` : ""}, {trackedOrder.city}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state when no search yet */}
              {!trackedOrder && !trackError && !trackSearchLoading && (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">উপরে আপনার অর্ডার নম্বর লিখে "ট্র্যাক" বাটনে ক্লিক করুন</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personal Info */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" /> ব্যক্তিগত তথ্য
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setProfileEditing(!profileEditing)} className="h-8 gap-1 text-xs">
                    {profileEditing ? <><X className="h-3.5 w-3.5" /> বাতিল</> : <><Pencil className="h-3.5 w-3.5" /> এডিট</>}
                  </Button>
                </div>

                {profileEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">নাম</Label>
                      <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="আপনার নাম" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">ফোন</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 11) })}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                    <Button onClick={handleProfileSave} disabled={saving} className="w-full mt-2 h-10">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      সেভ করুন
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { icon: User, label: "নাম", value: profile?.full_name || user?.user_metadata?.full_name || "সেট করা হয়নি" },
                      { icon: PhoneIcon, label: "ফোন", value: profile?.phone || "সেট করা হয়নি" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                        <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" /> ডিফল্ট ঠিকানা
                  </h3>
                </div>

                {profileEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">বিভাগ</Label>
                      <Select value={profileForm.default_division} onValueChange={(v) => setProfileForm({ ...profileForm, default_division: v, default_district: "", default_upazila: "" })}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{divisions.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">জেলা</Label>
                      <Select value={profileForm.default_district} onValueChange={(v) => setProfileForm({ ...profileForm, default_district: v, default_upazila: "" })} disabled={!profileForm.default_division}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{selectedDivision?.districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">উপজেলা</Label>
                      <Select value={profileForm.default_upazila} onValueChange={(v) => setProfileForm({ ...profileForm, default_upazila: v })} disabled={!profileForm.default_district}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{selectedDistrict?.upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">সম্পূর্ণ ঠিকানা</Label>
                      <Input value={profileForm.default_address} onChange={(e) => setProfileForm({ ...profileForm, default_address: e.target.value })} placeholder="বাড়ি, রোড, এলাকা..." />
                    </div>
                    <Button onClick={handleProfileSave} disabled={saving} className="w-full h-10">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      ঠিকানা সেভ করুন
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile?.default_division ? (
                      <>
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">লোকেশন</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {divisions.find((d) => d.name === profile.default_division)?.name_bn || profile.default_division}
                            {profile.default_district && ` › ${divisions.find((d) => d.name === profile.default_division)?.districts.find((d) => d.name === profile.default_district)?.name_bn || profile.default_district}`}
                            {profile.default_upazila && ` › ${profile.default_upazila}`}
                          </p>
                        </div>
                        {profile.default_address && (
                          <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ঠিকানা</p>
                            <p className="text-sm text-foreground mt-0.5">{profile.default_address}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">ডিফল্ট ঠিকানা সেট করা হয়নি</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setProfileEditing(true)}>
                          ঠিকানা যোগ করুন
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm mb-4">
                  <Shield className="h-4 w-4 text-primary" /> অ্যাকাউন্ট সিকিউরিটি
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">লগইন মেথড</p>
                      <p className="text-sm font-medium text-foreground">Google অ্যাকাউন্ট</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ইমেইল</p>
                      <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm">দ্রুত অ্যাকশন</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1.5">
                    <Link to="/products">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <span className="text-xs">পণ্য অর্ডার করুন</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => setActiveTab("orders")}>
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-xs">অর্ডার দেখুন</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => { setActiveTab("profile"); setProfileEditing(true); }}>
                    <Pencil className="h-5 w-5 text-primary" />
                    <span className="text-xs">প্রোফাইল এডিট</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-destructive hover:text-destructive" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                    <span className="text-xs">লগআউট</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm mb-4">
                  <HelpCircle className="h-4 w-4 text-primary" /> সচরাচর জিজ্ঞাসা
                </h3>
                <div className="space-y-3">
                  {[
                    { q: "ডেলিভারি কত দিনে হয়?", a: "সাধারণত ২-৪ দিনের মধ্যে ডেলিভারি হয়। ঢাকার বাইরে ৩-৫ দিন লাগতে পারে।" },
                    { q: "পেমেন্ট কিভাবে করবো?", a: "ক্যাশ অন ডেলিভারি - পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।" },
                    { q: "অর্ডার ক্যান্সেল করতে চাই?", a: "অর্ডার ক্যান্সেল করতে আমাদের সাথে যোগাযোগ করুন।" },
                    { q: "পণ্য কি ১০০% অরিজিনাল?", a: "হ্যাঁ, আমাদের সব পণ্য বিশ্বস্ত উৎস থেকে সংগ্রহ করা এবং গুণগত মান নিশ্চিত করেই পাঠানো হয়।" },
                  ].map((faq, i) => (
                    <div key={i} className="rounded-xl bg-muted/40 border border-border/30 p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">{faq.q}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm mb-4">
                  <PhoneIcon className="h-4 w-4 text-primary" /> যোগাযোগ
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                    <PhoneIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ফোন</p>
                      <p className="text-sm font-medium text-foreground">+880 1XXX-XXXXXX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                    <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ফেসবুক</p>
                      <p className="text-sm font-medium text-foreground">Sapahar Mango Shop</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-4 gap-2">
                  <Link to="/contact">
                    <HelpCircle className="h-4 w-4" /> বিস্তারিত যোগাযোগ
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile bottom actions */}
      <div className="sm:hidden mt-6">
        <Button variant="ghost" className="w-full text-destructive hover:text-destructive gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> লগআউট
        </Button>
      </div>
    </div>
  );
};

export default UserDashboard;
