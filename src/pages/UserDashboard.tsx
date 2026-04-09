import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Package, Clock, CheckCircle, Truck, XCircle, User,
  ShoppingBag, LogOut, MapPin, Phone as PhoneIcon, Pencil, X,
  Calendar, CreditCard, RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  city: string;
  payment_method: string;
  shipping_address: string;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "অপেক্ষমান", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
  confirmed: { label: "কনফার্মড", icon: CheckCircle, className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" },
  processing: { label: "প্রসেসিং", icon: Package, className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300" },
  shipped: { label: "শিপড", icon: Truck, className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300" },
  delivered: { label: "ডেলিভার্ড", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
  cancelled: { label: "বাতিল", icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300" },
};

const UserDashboard = () => {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    default_division: "",
    default_district: "",
    default_upazila: "",
    default_address: "",
  });
  const [saving, setSaving] = useState(false);
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
        .select("id, order_number, total, status, created_at, city, payment_method, shipping_address")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
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
      toast({ title: "প্রোফাইল আপডেট হয়েছে" });
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
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "processing").length;

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <div className="absolute inset-0 flex items-end pb-0">
          <div className="container flex items-end gap-3 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-0 translate-y-10 sm:translate-y-12">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-card border-4 border-background overflow-hidden shadow-xl flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
              )}
            </div>
            <div className="pb-1 sm:pb-2 min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate drop-shadow-md">
                {profile?.full_name || user?.user_metadata?.full_name || "ইউজার"}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 truncate">{user?.email}</p>
            </div>
            <div className="hidden sm:flex gap-2 pb-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0"
                onClick={() => { setActiveTab("profile"); setProfileEditing(true); }}
              >
                <Pencil className="h-3.5 w-3.5" />
                প্রোফাইল এডিট
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0"
                onClick={signOut}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for avatar overflow */}
      <div className="h-8 sm:h-10" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট অর্ডার</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">চলমান</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">{deliveredCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">ডেলিভার্ড</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-primary">৳{totalSpent.toLocaleString("bn-BD")}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট খরচ</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="orders" className="flex-1 sm:flex-none gap-1.5">
              <Package className="h-4 w-4" />
              <span>অর্ডার</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 sm:flex-none gap-1.5">
              <User className="h-4 w-4" />
              <span>প্রোফাইল</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "orders" && (
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="সব অর্ডার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব অর্ডার</SelectItem>
                  <SelectItem value="pending">অপেক্ষমান</SelectItem>
                  <SelectItem value="confirmed">কনফার্মড</SelectItem>
                  <SelectItem value="shipped">শিপড</SelectItem>
                  <SelectItem value="delivered">ডেলিভার্ড</SelectItem>
                  <SelectItem value="cancelled">বাতিল</SelectItem>
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
              <CardContent className="py-12 sm:py-16 text-center">
                <ShoppingBag className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-foreground font-semibold text-lg">
                  {statusFilter !== "all" ? "এই ফিল্টারে কোনো অর্ডার নেই" : "এখনো কোনো অর্ডার নেই"}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  সাপাহারের তাজা আম অর্ডার করুন এবং এখানে ট্র্যাক করুন
                </p>
                <Button asChild className="mt-5 gap-2">
                  <Link to="/products">
                    <ShoppingBag className="h-4 w-4" />আম দেখুন
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={order.id} className="border-border/50 hover:shadow-md transition-all duration-200 group">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${status.className}`}>
                          <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm sm:text-base">{order.order_number}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                <Badge variant="outline" className={`text-[10px] sm:text-xs border ${status.className}`}>
                                  {status.label}
                                </Badge>
                                <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(order.created_at).toLocaleDateString("bn-BD", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-base sm:text-lg font-bold text-primary">
                                ৳{Number(order.total).toLocaleString("bn-BD")}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                {order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method}
                              </p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{order.city}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Profile Info Card */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    ব্যক্তিগত তথ্য
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfileEditing(!profileEditing)}
                    className="h-8 gap-1"
                  >
                    {profileEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {profileEditing ? "বাতিল" : "এডিট"}
                  </Button>
                </div>

                {profileEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">নাম</Label>
                      <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">ফোন</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 11) })}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                    <Button onClick={handleProfileSave} disabled={saving} className="w-full mt-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      সেভ করুন
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">নাম</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.full_name || user?.user_metadata?.full_name || "সেট করা হয়নি"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ফোন</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.phone || "সেট করা হয়নি"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    ডিফল্ট ঠিকানা
                  </h3>
                </div>

                {profileEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">বিভাগ</Label>
                      <Select value={profileForm.default_division} onValueChange={(v) => setProfileForm({ ...profileForm, default_division: v, default_district: "", default_upazila: "" })}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{divisions.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">জেলা</Label>
                      <Select value={profileForm.default_district} onValueChange={(v) => setProfileForm({ ...profileForm, default_district: v, default_upazila: "" })} disabled={!profileForm.default_division}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{selectedDivision?.districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">উপজেলা</Label>
                      <Select value={profileForm.default_upazila} onValueChange={(v) => setProfileForm({ ...profileForm, default_upazila: v })} disabled={!profileForm.default_district}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>{selectedDistrict?.upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">সম্পূর্ণ ঠিকানা</Label>
                      <Input value={profileForm.default_address} onChange={(e) => setProfileForm({ ...profileForm, default_address: e.target.value })} placeholder="বাড়ি, রোড, এলাকা..." />
                    </div>
                    <Button onClick={handleProfileSave} disabled={saving} className="w-full">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      ঠিকানা সেভ করুন
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile?.default_division ? (
                      <>
                        <div className="p-3 rounded-xl bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">লোকেশন</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {divisions.find((d) => d.name === profile.default_division)?.name_bn || profile.default_division}
                            {profile.default_district && ` > ${divisions.find((d) => d.name === profile.default_division)?.districts.find((d) => d.name === profile.default_district)?.name_bn || profile.default_district}`}
                            {profile.default_upazila && ` > ${profile.default_upazila}`}
                          </p>
                        </div>
                        {profile.default_address && (
                          <div className="p-3 rounded-xl bg-muted/50">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ঠিকানা</p>
                            <p className="text-sm text-foreground mt-0.5">{profile.default_address}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-6 text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">ডিফল্ট ঠিকানা সেট করা হয়নি</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setProfileEditing(true)}
                        >
                          ঠিকানা যোগ করুন
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions - Mobile */}
            <Card className="sm:col-span-2 border-border/50">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-foreground mb-3">দ্রুত অ্যাকশন</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1.5">
                    <Link to="/products">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <span className="text-xs">আম অর্ডার করুন</span>
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
      </Tabs>
    </div>
  );
};

export default UserDashboard;
