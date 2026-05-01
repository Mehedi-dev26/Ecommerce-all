import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";

interface ExpenseRow {
  id: string;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
}

const CATEGORIES = [
  { value: "rent", label: "ভাড়া" },
  { value: "transport", label: "পরিবহন/ডেলিভারি" },
  { value: "marketing", label: "মার্কেটিং/বিজ্ঞাপন" },
  { value: "salary", label: "বেতন" },
  { value: "utilities", label: "বিদ্যুৎ/ইন্টারনেট" },
  { value: "packaging", label: "প্যাকেজিং" },
  { value: "other", label: "অন্যান্য" },
];

const emptyForm = {
  category: "other",
  title: "",
  amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const ExpensesPanel = () => {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
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
      const { data, error } = await supabase
        .from("business_expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      setRows((data || []) as ExpenseRow[]);
    } catch (e) {
      setError(getErrorMessage(e, "খরচের হিসাব লোড করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form.title || form.amount <= 0) {
      toast({ title: "তথ্য অসম্পূর্ণ", description: "শিরোনাম ও পরিমাণ দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("business_expenses").insert({
        category: form.category,
        title: form.title,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes || null,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: "খরচ যোগ হয়েছে" });
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
    if (!confirm("এই খরচ মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("business_expenses").delete().eq("id", id);
    if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    else { toast({ title: "মুছে ফেলা হয়েছে" }); void load(); }
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const thisMonth = rows
    .filter((r) => r.expense_date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, r) => s + Number(r.amount), 0);

  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label || v;

  if (loading) return <AdminPageState loading message="খরচের হিসাব লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">মোট খরচ</p>
            <p className="text-lg sm:text-2xl font-bold text-destructive">৳{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground">এই মাসে</p>
            <p className="text-lg sm:text-2xl font-bold">৳{thisMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{rows.length} টি খরচ রেকর্ড</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="shadow-sm"><Plus className="h-4 w-4 mr-1" />নতুন খরচ যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader><DialogTitle>নতুন খরচ রেকর্ড</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">ক্যাটাগরি</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">শিরোনাম</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: জুন মাসের ভাড়া" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">পরিমাণ (৳)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">তারিখ</Label>
                  <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">নোট</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ঐচ্ছিক" />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">তারিখ</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">ক্যাটাগরি</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">শিরোনাম</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase text-muted-foreground">পরিমাণ</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.expense_date).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-muted">
                        {catLabel(r.category)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium">{r.title}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-destructive">৳{Number(r.amount).toLocaleString()}</td>
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
                <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">এখনো কোনো খরচ রেকর্ড নেই</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPanel;
