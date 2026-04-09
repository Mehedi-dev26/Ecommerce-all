import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Clock, CheckCircle, Truck, XCircle, User, MapPin, Phone, ShoppingBag, LogOut, ChevronRight } from "lucide-react";
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
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "অপেক্ষমান", icon: Clock, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "কনফার্মড", icon: CheckCircle, color: "bg-blue-100 text-blue-700 border-blue-200" },
  processing: { label: "প্রসেসিং", icon: Package, color: "bg-purple-100 text-purple-700 border-purple-200" },
  shipped: { label: "শিপড", icon: Truck, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  delivered: { label: "ডেলিভার্ড", icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "বাতিল", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
};

const UserDashboard = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
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
    if (user) {
      fetchOrders();
    }
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
        .select("id, order_number, total, status, created_at, city, payment_method")
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

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/50 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
            <CardContent className="pt-0 -mt-10 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-card border-4 border-card overflow-hidden shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <h2 className="mt-3 text-lg font-bold text-foreground">
                {profile?.full_name || user?.user_metadata?.full_name || "ইউজার"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{orders.length}</p>
                  <p className="text-[10px] text-muted-foreground">অর্ডার</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{deliveredCount}</p>
                  <p className="text-[10px] text-muted-foreground">ডেলিভার্ড</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-primary">৳{totalSpent}</p>
                  <p className="text-[10px] text-muted-foreground">মোট খরচ</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setProfileEditing(!profileEditing)}
                >
                  {profileEditing ? "বাতিল" : "প্রোফাইল এডিট"}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          {profileEditing && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">নাম</Label>
                  <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ফোন</Label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">বিভাগ</Label>
                  <Select value={profileForm.default_division} onValueChange={(v) => setProfileForm({ ...profileForm, default_division: v, default_district: "", default_upazila: "" })}>
                    <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                    <SelectContent>{divisions.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">জেলা</Label>
                  <Select value={profileForm.default_district} onValueChange={(v) => setProfileForm({ ...profileForm, default_district: v, default_upazila: "" })} disabled={!profileForm.default_division}>
                    <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                    <SelectContent>{selectedDivision?.districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">উপজেলা</Label>
                  <Select value={profileForm.default_upazila} onValueChange={(v) => setProfileForm({ ...profileForm, default_upazila: v })} disabled={!profileForm.default_district}>
                    <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                    <SelectContent>{selectedDistrict?.upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ঠিকানা</Label>
                  <Input value={profileForm.default_address} onChange={(e) => setProfileForm({ ...profileForm, default_address: e.target.value })} placeholder="বাড়ি, রোড, এলাকা..." />
                </div>
                <Button onClick={handleProfileSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  সেভ করুন
                </Button>
              </CardContent>
            </Card>
          )}

          <Button asChild className="w-full gap-2">
            <Link to="/products"><ShoppingBag className="h-4 w-4" />আম অর্ডার করুন</Link>
          </Button>
        </div>

        {/* Orders Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              আমার অর্ডারসমূহ
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">এখনো কোনো অর্ডার নেই</p>
                <p className="text-sm text-muted-foreground mt-1">আম অর্ডার করুন এবং এখানে ট্র্যাক করুন</p>
                <Button asChild className="mt-4">
                  <Link to="/products">আম দেখুন</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={order.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status.color}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.created_at).toLocaleDateString("bn-BD", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                {status.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{order.city}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-primary">৳{order.total}</p>
                          <p className="text-xs text-muted-foreground capitalize">{order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
