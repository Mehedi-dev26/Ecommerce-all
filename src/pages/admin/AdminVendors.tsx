import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Store, Phone, MapPin, IdCard, Mail, ExternalLink, CheckCircle2, XCircle, Loader2, Search, Percent, Pause, Play, Trash2 } from "lucide-react";

interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
  logo_url: string | null;
  description: string | null;
  owner_name: string;
  nid_number: string;
  phone: string;
  email: string;
  facebook_url: string | null;
  division: string;
  district: string;
  upazila: string;
  address: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason: string | null;
  approved_at: string | null;
  commission_percent: number;
  total_orders: number;
  total_revenue: number;
  total_commission_earned: number;
  created_at: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "অপেক্ষমাণ", cls: "bg-amber-100 text-amber-800 border-amber-300" },
    approved: { label: "অনুমোদিত", cls: "bg-green-100 text-green-800 border-green-300" },
    rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-100 text-red-800 border-red-300" },
    suspended: { label: "স্থগিত", cls: "bg-gray-100 text-gray-800 border-gray-300" },
  };
  const s = map[status] || map.pending;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
};

const AdminVendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "suspended">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendors" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "লোড ব্যর্থ", description: error.message, variant: "destructive" });
    else setVendors((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (v: Vendor) => {
    setBusy(true);
    try {
      const { error: vErr } = await supabase
        .from("vendors" as any)
        .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user?.id, rejection_reason: null })
        .eq("id", v.id);
      if (vErr) throw vErr;

      // Assign 'vendor' role (ignore conflict)
      await supabase.from("user_roles").insert({ user_id: v.user_id, role: "vendor" as any });

      toast({ title: "অনুমোদিত!", description: `${v.shop_name_bn} এখন সক্রিয় বিক্রেতা` });
      await load();
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("vendors" as any)
        .update({ status: "rejected", rejection_reason: rejectReason })
        .eq("id", rejectingId);
      if (error) throw error;
      toast({ title: "প্রত্যাখ্যাত" });
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vendors" as any).update({ status }).eq("id", id);
    if (error) toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    else { toast({ title: "আপডেট হয়েছে" }); await load(); }
  };

  const updateCommission = async (id: string, pct: number) => {
    const { error } = await supabase.from("vendors" as any).update({ commission_percent: pct }).eq("id", id);
    if (error) toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    else { toast({ title: "কমিশন আপডেট হয়েছে" }); await load(); }
  };

  const deleteVendor = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত? এই ডেটা মুছে ফেলা হবে।")) return;
    const { error } = await supabase.from("vendors" as any).delete().eq("id", id);
    if (error) toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    else { toast({ title: "মুছে ফেলা হয়েছে" }); await load(); }
  };

  const filtered = vendors.filter((v) => {
    if (v.status !== tab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.shop_name_bn.toLowerCase().includes(q) ||
      v.shop_name.toLowerCase().includes(q) ||
      v.owner_name.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      v.nid_number.includes(q)
    );
  });

  const counts = {
    pending: vendors.filter((v) => v.status === "pending").length,
    approved: vendors.filter((v) => v.status === "approved").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
    suspended: vendors.filter((v) => v.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">দোকান নিবন্ধন</h2>
          <p className="text-sm text-muted-foreground">বিক্রেতা আবেদন রিভিউ ও অনুমোদন পরিচালনা</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="pending">অপেক্ষমাণ ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">অনুমোদিত ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">প্রত্যাখ্যাত ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="suspended">স্থগিত ({counts.suspended})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো বিক্রেতা পাওয়া যায়নি</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((v) => (
                <Card key={v.id} className="rounded-2xl hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                        {v.logo_url ? <img src={v.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{v.shop_name_bn}</h3>
                        <p className="text-xs text-muted-foreground truncate">{v.shop_name}</p>
                        <div className="mt-1"><StatusBadge status={v.status} /></div>
                      </div>
                    </div>

                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-2"><span className="font-medium text-foreground">{v.owner_name}</span></p>
                      <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {v.phone}</p>
                      <p className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /> {v.nid_number}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {v.upazila}, {v.district}</p>
                    </div>

                    {v.status === "approved" && (
                      <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-lg p-2">
                        <Percent className="h-3.5 w-3.5 text-primary" />
                        <span>কমিশন: <strong>{v.commission_percent}%</strong></span>
                        <span className="ml-auto text-muted-foreground">{v.total_orders} অর্ডার</span>
                      </div>
                    )}

                    {v.status === "rejected" && v.rejection_reason && (
                      <div className="text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg p-2">
                        <strong>কারণ:</strong> {v.rejection_reason}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected(v)}>বিস্তারিত</Button>
                      {v.status === "pending" && (
                        <>
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => approve(v)} disabled={busy}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> অনুমোদন
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setRejectingId(v.id); setRejectReason(""); }}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                    {selected.logo_url ? <img src={selected.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6" />}
                  </div>
                  <div>
                    <div>{selected.shop_name_bn}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selected.shop_name}</div>
                  </div>
                </DialogTitle>
                <DialogDescription>সম্পূর্ণ বিক্রেতা তথ্য</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selected.description && (
                  <div className="text-sm bg-muted/50 rounded-lg p-3">{selected.description}</div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><Label className="text-xs text-muted-foreground">মালিক</Label><p className="font-medium">{selected.owner_name}</p></div>
                  <div><Label className="text-xs text-muted-foreground">NID</Label><p className="font-medium">{selected.nid_number}</p></div>
                  <div><Label className="text-xs text-muted-foreground">ফোন</Label><p className="font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</p></div>
                  <div><Label className="text-xs text-muted-foreground">ইমেইল</Label><p className="font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</p></div>
                  <div className="col-span-2"><Label className="text-xs text-muted-foreground">ঠিকানা</Label><p className="font-medium">{selected.address}, {selected.upazila}, {selected.district}, {selected.division}</p></div>
                  {selected.facebook_url && (
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Facebook</Label><a href={selected.facebook_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary flex items-center gap-1 hover:underline"><ExternalLink className="h-3 w-3" />{selected.facebook_url}</a></div>
                  )}
                </div>

                {selected.status === "approved" && (
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2"><Percent className="h-4 w-4" /> কমিশন ও অ্যাকশন</h4>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>কমিশন (%)</Label>
                        <Input
                          type="number" min="0" max="100" step="0.1"
                          defaultValue={selected.commission_percent}
                          onBlur={(e) => {
                            const pct = parseFloat(e.target.value);
                            if (!isNaN(pct) && pct !== selected.commission_percent) updateCommission(selected.id, pct);
                          }}
                        />
                      </div>
                      <Button variant="outline" onClick={() => updateStatus(selected.id, "suspended")}>
                        <Pause className="h-4 w-4 mr-1" /> স্থগিত
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-muted/50 rounded-lg p-2"><div className="font-bold text-base">{selected.total_orders}</div><div className="text-muted-foreground">অর্ডার</div></div>
                      <div className="bg-muted/50 rounded-lg p-2"><div className="font-bold text-base">৳{selected.total_revenue.toFixed(0)}</div><div className="text-muted-foreground">আয়</div></div>
                      <div className="bg-muted/50 rounded-lg p-2"><div className="font-bold text-base">৳{selected.total_commission_earned.toFixed(0)}</div><div className="text-muted-foreground">কমিশন</div></div>
                    </div>
                  </div>
                )}

                {selected.status === "suspended" && (
                  <Button onClick={() => updateStatus(selected.id, "approved")} className="w-full">
                    <Play className="h-4 w-4 mr-1" /> পুনরায় চালু করুন
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => deleteVendor(selected.id)} className="mr-auto text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> মুছুন
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>বন্ধ করুন</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>আবেদন প্রত্যাখ্যান করুন</DialogTitle>
            <DialogDescription>প্রত্যাখ্যানের কারণ লিখুন। বিক্রেতা এই কারণ দেখতে পাবেন।</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="যেমনঃ NID তথ্য মিলছে না..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={reject} disabled={busy || !rejectReason.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "প্রত্যাখ্যান"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;
