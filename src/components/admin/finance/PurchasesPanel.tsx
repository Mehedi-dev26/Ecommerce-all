import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";

interface PurchaseRow {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name: string | null;
  purchase_date: string;
  notes: string | null;
}

interface ProductOption { id: string; name_bn: string; }

const emptyForm = {
  product_id: "",
  product_name: "",
  quantity: 0,
  unit_cost: 0,
  supplier_name: "",
  purchase_date: new Date().toISOString().slice(0, 10),
  notes: "",
  update_product_cost: true,
};

const PurchasesPanel = () => {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [purRes, prodRes] = await Promise.all([
        supabase.from("inventory_purchases").select("*").order("purchase_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name_bn").order("name_bn"),
      ]);
      if (purRes.error) throw purRes.error;
      if (prodRes.error) throw prodRes.error;
      setRows((purRes.data || []) as PurchaseRow[]);
      setProducts((prodRes.data || []) as ProductOption[]);
    } catch (e) {
      setError(getErrorMessage(e, "ক্রয় হিসাব লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form.product_name || form.quantity <= 0 || form.unit_cost < 0) {
      toast({ title: "তথ্য অসম্পূর্ণ", description: "পণ্যের নাম, পরিমাণ এবং দাম দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const total = Number(form.quantity) * Number(form.unit_cost);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("inventory_purchases").insert({
        product_id: form.product_id || null,
        product_name: form.product_name,
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost),
        total_cost: total,
        supplier_name: form.supplier_name || null,
        purchase_date: form.purchase_date,
        notes: form.notes || null,
        created_by: user?.id || null,
      });
      if (error) throw error;

      // Optionally update product stock + cost_price
      if (form.product_id) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", form.product_id).single();
        const newStock = (prod?.stock || 0) + Number(form.quantity);
        const updates: { stock: number; cost_price?: number } = { stock: newStock };
        if (form.update_product_cost) updates.cost_price = Number(form.unit_cost);
        await supabase.from("products").update(updates).eq("id", form.product_id);
      }

      toast({ title: "ক্রয় যোগ হয়েছে", description: `৳${total.toLocaleString()} এর ক্রয় রেকর্ড করা হয়েছে।` });
      setOpen(false);
      setForm(emptyForm);
      void load();
    } catch (e) {
      toast({ title: "ত্রুটি", description: getErrorMessage(e, "সংরক্ষণ ব্যর্থ"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("এই ক্রয় রেকর্ডটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("inventory_purchases").delete().eq("id", id);
    if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    else { toast({ title: "মুছে ফেলা হয়েছে" }); void load(); }
  };

  const totalSpend = rows.reduce((s, r) => s + Number(r.total_cost), 0);
  const thisMonth = rows
    .filter((r) => r.purchase_date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, r) => s + Number(r.total_cost), 0);

  if (loading) return <AdminPageState loading message="ক্রয় হিসাব লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট ক্রয় ব্যয়</p>
            <p className="text-lg sm:text-2xl font-bold">৳{totalSpend.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">এই মাসে</p>
            <p className="text-lg sm:text-2xl font-bold text-primary">৳{thisMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{rows.length} টি ক্রয় রেকর্ড</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="shadow-sm"><Plus className="h-4 w-4 mr-1" />নতুন ক্রয় যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader><DialogTitle>নতুন ক্রয় রেকর্ড</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">প্রোডাক্ট (লিংক করুন)</Label>
                <Select
                  value={form.product_id || "manual"}
                  onValueChange={(v) => {
                    if (v === "manual") setForm({ ...form, product_id: "", product_name: "" });
                    else {
                      const p = products.find((x) => x.id === v);
                      setForm({ ...form, product_id: v, product_name: p?.name_bn || "" });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">ম্যানুয়াল (কাস্টম নাম)</SelectItem>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_bn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">পণ্যের নাম</Label>
                <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="যেমন: হিমসাগর আম" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">পরিমাণ (kg/pcs)</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">প্রতি ইউনিট মূল্য (৳)</Label>
                  <Input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: +e.target.value })} />
                </div>
              </div>
              {form.quantity > 0 && form.unit_cost > 0 && (
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  মোট ক্রয় মূল্য: <span className="font-bold">৳{(form.quantity * form.unit_cost).toLocaleString()}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">সরবরাহকারী</Label>
                  <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} placeholder="ঐচ্ছিক" />
                </div>
                <div>
                  <Label className="text-xs">তারিখ</Label>
                  <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">নোট</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ঐচ্ছিক" />
              </div>
              {form.product_id && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.update_product_cost}
                    onChange={(e) => setForm({ ...form, update_product_cost: e.target.checked })}
                  />
                  <span>প্রোডাক্টের cost price আপডেট করুন এবং stock-এ যোগ করুন</span>
                </label>
              )}
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <Card key={r.id} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.product_name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(r.purchase_date).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    {r.supplier_name && <> · {r.supplier_name}</>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-7 w-7 text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
                <div><p className="text-[10px] text-muted-foreground">পরিমাণ</p><p className="text-sm font-semibold">{r.quantity}</p></div>
                <div><p className="text-[10px] text-muted-foreground">প্রতি ইউনিট</p><p className="text-sm font-semibold">৳{Number(r.unit_cost).toLocaleString()}</p></div>
                <div className="text-right"><p className="text-[10px] text-muted-foreground">মোট</p><p className="text-sm font-bold text-primary">৳{Number(r.total_cost).toLocaleString()}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">এখনো কোনো ক্রয় রেকর্ড নেই</p>
          </div>
        )}
      </div>

      <Card className="border-border/50 overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">তারিখ</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">পণ্য</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">পরিমাণ</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground hidden sm:table-cell">প্রতি ইউনিট</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">মোট</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground hidden md:table-cell">সরবরাহকারী</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.purchase_date).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{r.product_name}</td>
                    <td className="py-2.5 px-3 text-right">{r.quantity}</td>
                    <td className="py-2.5 px-3 text-right hidden sm:table-cell">৳{Number(r.unit_cost).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">৳{Number(r.total_cost).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell">{r.supplier_name || "—"}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">এখনো কোনো ক্রয় রেকর্ড নেই</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasesPanel;
