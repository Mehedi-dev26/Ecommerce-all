import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Store, Phone, Mail, MapPin, Search, Loader2, Pencil, Save, KeyRound,
  Clock, ShoppingBag, Package, Percent, Pause, Play, Activity, ShieldCheck, Globe,
} from "lucide-react";

interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
  logo_url: string | null;
  description: string | null;
  owner_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string;
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

interface Activity {
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

const fmtDate = (s?: string | null) =>
  !s ? "—" : new Date(s).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });

const AdminVendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [editing, setEditing] = useState<Partial<Vendor> | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendors" as any)
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "লোড ব্যর্থ", description: error.message, variant: "destructive" });
    else setVendors((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openVendor = async (v: Vendor) => {
    setSelected(v);
    setEditing({ ...v });
    setActivity(null);
    setActivityLoading(true);
    const { data, error } = await (supabase as any).rpc("admin_get_vendor_activity", { _vendor_id: v.id });
    if (error) toast({ title: "অ্যাক্টিভিটি লোড ব্যর্থ", description: error.message, variant: "destructive" });
    else setActivity(data as Activity);
    setActivityLoading(false);
  };

  const save = async () => {
    if (!editing || !selected) return;
    setBusy(true);
    const payload: any = {
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
    const { error } = await supabase.from("vendors" as any).update(payload).eq("id", selected.id);
    setBusy(false);
    if (error) return toast({ title: "সংরক্ষণ ব্যর্থ", description: error.message, variant: "destructive" });
    toast({ title: "সংরক্ষিত হয়েছে" });
    await load();
    setSelected(null);
  };

  const sendPasswordReset = async () => {
    if (!editing?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(editing.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast({ title: "পাঠানো ব্যর্থ", description: error.message, variant: "destructive" });
    else toast({ title: "পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে", description: editing.email });
  };

  const toggleSuspend = async () => {
    if (!selected) return;
    const next = selected.status === "approved" ? "suspended" : "approved";
    const { error } = await supabase.from("vendors" as any).update({ status: next }).eq("id", selected.id);
    if (error) return toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    toast({ title: next === "suspended" ? "দোকান স্থগিত" : "দোকান পুনরায় চালু" });
    await load();
    setSelected(null);
  };

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [v.shop_name_bn, v.shop_name, v.owner_name, v.phone, v.email].some((x) => x?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">ভেন্ডর ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">অনুমোদিত বিক্রেতাদের সম্পূর্ণ নিয়ন্ত্রণ — তথ্য সম্পাদনা, কার্যকলাপ ও লগইন ইতিহাস</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="দোকান, মালিক, ফোন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো অনুমোদিত বিক্রেতা নেই</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="rounded-2xl hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {v.logo_url ? <img src={v.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{v.shop_name_bn}</h3>
                    <p className="text-xs text-muted-foreground truncate">/{v.shop_slug}</p>
                    <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-300">
                      <ShieldCheck className="h-3 w-3 mr-1" /> অনুমোদিত
                    </Badge>
                  </div>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>{v.owner_name}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {v.phone}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {v.upazila}, {v.district}</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-lg p-2">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  <span>কমিশন: <strong>{v.commission_percent}%</strong></span>
                  <span className="ml-auto">{v.total_orders} অর্ডার</span>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => openVendor(v)}>
                  <Pencil className="h-4 w-4 mr-1" /> ম্যানেজ ও সম্পাদনা
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selected && editing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                    {selected.logo_url ? <img src={selected.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6" />}
                  </div>
                  <div>
                    <div>{selected.shop_name_bn}</div>
                    <div className="text-sm font-normal text-muted-foreground">/{selected.shop_slug}</div>
                  </div>
                </DialogTitle>
                <DialogDescription>সম্পূর্ণ ভেন্ডর কন্ট্রোল প্যানেল</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="info"><Pencil className="h-4 w-4 mr-1" /> সম্পাদনা</TabsTrigger>
                  <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1" /> অ্যাক্টিভিটি</TabsTrigger>
                  <TabsTrigger value="security"><KeyRound className="h-4 w-4 mr-1" /> সিকিউরিটি</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="দোকান নাম (বাংলা)" value={editing.shop_name_bn || ""} onChange={(v) => setEditing({ ...editing, shop_name_bn: v })} />
                    <Field label="দোকান নাম (English)" value={editing.shop_name || ""} onChange={(v) => setEditing({ ...editing, shop_name: v })} />
                    <Field label="মালিক" value={editing.owner_name || ""} onChange={(v) => setEditing({ ...editing, owner_name: v })} />
                    <Field label="ফোন" value={editing.phone || ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
                    <Field label="WhatsApp" value={editing.whatsapp_number || ""} onChange={(v) => setEditing({ ...editing, whatsapp_number: v })} />
                    <Field label="ইমেইল" value={editing.email || ""} onChange={(v) => setEditing({ ...editing, email: v })} />
                    <Field label="ডিভিশন" value={editing.division || ""} onChange={(v) => setEditing({ ...editing, division: v })} />
                    <Field label="জেলা" value={editing.district || ""} onChange={(v) => setEditing({ ...editing, district: v })} />
                    <Field label="উপজেলা" value={editing.upazila || ""} onChange={(v) => setEditing({ ...editing, upazila: v })} />
                    <Field label="কমিশন (%)" type="number" value={String(editing.commission_percent ?? 0)} onChange={(v) => setEditing({ ...editing, commission_percent: parseFloat(v) || 0 })} />
                    <div className="col-span-2">
                      <Field label="Facebook URL" value={editing.facebook_url || ""} onChange={(v) => setEditing({ ...editing, facebook_url: v })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">ঠিকানা</Label>
                      <Textarea value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">বিবরণ</Label>
                      <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
                    </div>
                  </div>
                  <Button onClick={save} disabled={busy} className="w-full">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} পরিবর্তন সংরক্ষণ করুন
                  </Button>
                </TabsContent>

                <TabsContent value="activity" className="space-y-3 mt-4">
                  {activityLoading ? (
                    <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                  ) : !activity ? (
                    <p className="text-sm text-muted-foreground text-center py-6">তথ্য পাওয়া যায়নি</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <Stat icon={ShoppingBag} label="অর্ডার" value={activity.orders_count} />
                        <Stat icon={Package} label="পণ্য" value={activity.products_count} />
                        <Stat icon={Percent} label="কমিশন আয়" value={`৳${Math.round(selected.total_commission_earned)}`} />
                      </div>

                      <div className="border rounded-xl divide-y">
                        <Row icon={Mail} label="লগইন ইমেইল" value={activity.auth?.email || "—"} />
                        <Row icon={Globe} label="লগইন প্রোভাইডার" value={(activity.auth?.providers || [activity.auth?.provider]).filter(Boolean).join(", ") || "email"} />
                        <Row icon={ShieldCheck} label="ইমেইল ভেরিফাইড" value={fmtDate(activity.auth?.email_confirmed_at)} />
                        <Row icon={Clock} label="অ্যাকাউন্ট তৈরি" value={fmtDate(activity.auth?.created_at)} />
                        <Row icon={Activity} label="সর্বশেষ লগইন" value={fmtDate(activity.auth?.last_sign_in_at)} highlight />
                        <Row icon={ShieldCheck} label="অনুমোদিত হয়েছে" value={fmtDate(selected.approved_at)} />
                        <Row icon={ShoppingBag} label="সর্বশেষ অর্ডার" value={fmtDate(activity.last_order_at)} />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="bg-muted/40 rounded-xl p-4 text-sm">
                    <p className="font-semibold mb-1">পাসওয়ার্ড দেখা সম্ভব নয়</p>
                    <p className="text-muted-foreground text-xs">
                      সুরক্ষার কারণে Supabase পাসওয়ার্ড encrypted হ্যাশ আকারে সংরক্ষণ করে — কেউ (এমনকি অ্যাডমিনও) তা দেখতে পারে না।
                      বিক্রেতার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান যাতে তারা নতুন পাসওয়ার্ড সেট করতে পারে।
                    </p>
                  </div>
                  <Button onClick={sendPasswordReset} disabled={busy || !editing.email} className="w-full" variant="outline">
                    <KeyRound className="h-4 w-4 mr-1" /> পাসওয়ার্ড রিসেট লিংক পাঠান
                  </Button>

                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-2">দোকান স্ট্যাটাস</p>
                    <Button onClick={toggleSuspend} variant={selected.status === "approved" ? "destructive" : "default"} className="w-full">
                      {selected.status === "approved" ? <><Pause className="h-4 w-4 mr-1" /> দোকান স্থগিত করুন</> : <><Play className="h-4 w-4 mr-1" /> পুনরায় চালু করুন</>}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>বন্ধ করুন</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => (
  <div className="bg-muted/50 rounded-xl p-3 text-center">
    <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
    <div className="font-bold text-base">{value}</div>
    <div className="text-[10px] text-muted-foreground">{label}</div>
  </div>
);

const Row = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${highlight ? "bg-primary/5" : ""}`}>
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-muted-foreground flex-1">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default AdminVendorManagement;
