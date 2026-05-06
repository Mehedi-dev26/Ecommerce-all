import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Plus, Pencil, Trash2, Truck, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions } from "@/data/bd-locations";

interface CourierCharge {
  id: string;
  division: string;
  district: string;
  upazila: string | null;
  charge_per_kg: number;
  label: string | null;
}

const emptyForm = {
  division: "",
  district: "",
  upazila: "",
  charge_per_kg: 0,
  label: "",
};

const AdminCourierCharges = () => {
  const [charges, setCharges] = useState<CourierCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CourierCharge | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchCharges = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("courier_charges")
        .select("*")
        .order("division")
        .order("district")
        .order("upazila");
      if (error) throw error;
      setCharges((data || []) as CourierCharge[]);
    } catch (err) {
      setError(getErrorMessage(err, "কুরিয়ার চার্জ লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCharges(); }, []);

  // Cascading location selectors
  const selectedDivision = divisions.find((d) => d.name === form.division);
  const districts = selectedDivision?.districts || [];
  const selectedDistrict = districts.find((d) => d.name === form.district);
  const upazilas = selectedDistrict?.upazilas || [];

  const handleSave = async () => {
    if (!form.division || !form.district) {
      toast({ title: "ত্রুটি", description: "বিভাগ ও জেলা আবশ্যক", variant: "destructive" });
      return;
    }
    if (!form.charge_per_kg || Number(form.charge_per_kg) <= 0) {
      toast({ title: "ত্রুটি", description: "ডেলিভারি চার্জ ০ এর বেশি হতে হবে", variant: "destructive" });
      return;
    }

    const upazilaValue = (form.upazila && form.upazila !== "__all__") ? form.upazila : null;

    const payload = {
      division: form.division,
      district: form.district,
      upazila: upazilaValue,
      charge_per_kg: Number(form.charge_per_kg),
      label: form.label?.trim() || null,
    };

    // Pre-check duplicate (PostgreSQL UNIQUE doesn't treat NULL as equal,
    // so we must guard manually for the "all upazilas" case).
    if (!editing) {
      let dupQuery = supabase
        .from("courier_charges")
        .select("id")
        .eq("division", payload.division)
        .eq("district", payload.district);
      dupQuery = upazilaValue ? dupQuery.eq("upazila", upazilaValue) : dupQuery.is("upazila", null);
      const { data: existing } = await dupQuery.maybeSingle();
      if (existing) {
        toast({
          title: "ডুপ্লিকেট চার্জ",
          description: "এই বিভাগ + জেলা" + (upazilaValue ? " + উপজেলা" : "") + " এর জন্য চার্জ আগে থেকেই আছে। এডিট করুন বা ভিন্ন উপজেলা বাছুন।",
          variant: "destructive",
        });
        return;
      }
    }

    let err;
    if (editing) {
      ({ error: err } = await supabase.from("courier_charges").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("courier_charges").insert(payload));
    }

    if (err) {
      const friendly = err.code === "23505"
        ? "এই এলাকার জন্য চার্জ আগে থেকেই আছে। আগের এন্ট্রি এডিট করুন।"
        : err.message;
      toast({ title: "সংরক্ষণ ব্যর্থ", description: friendly, variant: "destructive" });
    } else {
      toast({ title: editing ? "আপডেট সফল" : "কুরিয়ার চার্জ যোগ হয়েছে" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void fetchCharges();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই চার্জটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("courier_charges").delete().eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "মুছে ফেলা হয়েছে" });
      void fetchCharges();
    }
  };

  const openEdit = (c: CourierCharge) => {
    setEditing(c);
    setForm({
      division: c.division,
      district: c.district,
      upazila: c.upazila || "",
      charge_per_kg: c.charge_per_kg,
      label: c.label || "",
    });
    setDialogOpen(true);
  };

  const getDivisionBn = (name: string) => divisions.find((d) => d.name === name)?.name_bn || name;
  const getDistrictBn = (divName: string, distName: string) => {
    const div = divisions.find((d) => d.name === divName);
    return div?.districts.find((d) => d.name === distName)?.name_bn || distName;
  };
  const getUpazilaBn = (divName: string, distName: string, upName: string) => {
    const div = divisions.find((d) => d.name === divName);
    const dist = div?.districts.find((d) => d.name === distName);
    return dist?.upazilas.find((u) => u.name === upName)?.name_bn || upName;
  };

  const filtered = charges.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.division.toLowerCase().includes(s) ||
      c.district.toLowerCase().includes(s) ||
      (c.upazila?.toLowerCase().includes(s)) ||
      (c.label?.toLowerCase().includes(s)) ||
      getDivisionBn(c.division).includes(s) ||
      getDistrictBn(c.division, c.district).includes(s)
    );
  });

  if (loading) return <AdminPageState loading message="কুরিয়ার চার্জ লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={fetchCharges} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> কুরিয়ার চার্জ
          </h2>
          <p className="text-sm text-muted-foreground">{charges.length} টি চার্জ সেট করা আছে</p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/20"
          onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" /> নতুন চার্জ যোগ
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="বিভাগ, জেলা দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Charges List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {getDivisionBn(c.division)} → {getDistrictBn(c.division, c.district)}
                  </p>
                  {c.upazila && (
                    <p className="text-xs text-muted-foreground">
                      {getUpazilaBn(c.division, c.district, c.upazila)}
                    </p>
                  )}
                  {c.label && (
                    <p className="text-xs text-primary font-medium mt-1">{c.label}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2 p-2 rounded-lg bg-primary/5">
                <span className="text-xl font-bold text-primary">৳{c.charge_per_kg}</span>
                <span className="text-xs text-muted-foreground">/কেজি</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "কোনো ফলাফল পাওয়া যায়নি" : "কোনো কুরিয়ার চার্জ সেট করা হয়নি"}</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {editing ? "চার্জ এডিট" : "নতুন কুরিয়ার চার্জ"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Division */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">বিভাগ *</Label>
              <Select
                value={form.division}
                onValueChange={(v) => setForm({ ...form, division: v, district: "", upazila: "" })}
              >
                <SelectTrigger><SelectValue placeholder="বিভাগ নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">জেলা *</Label>
              <Select
                value={form.district}
                onValueChange={(v) => setForm({ ...form, district: v, upazila: "" })}
                disabled={!form.division}
              >
                <SelectTrigger><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upazila (optional) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">উপজেলা (ঐচ্ছিক)</Label>
              <Select
                value={form.upazila}
                onValueChange={(v) => setForm({ ...form, upazila: v })}
                disabled={!form.district}
              >
                <SelectTrigger><SelectValue placeholder="সব উপজেলা (ডিফল্ট)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">সব উপজেলা</SelectItem>
                  {upazilas.map((u) => (
                    <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">লেবেল / নাম</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="যেমন: ঢাকা সিটি, রাজশাহী জেলা"
              />
            </div>

            {/* Charge per kg */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ডেলিভারি চার্জ (প্রতি কেজি) ৳</Label>
              <Input
                type="number"
                min={0}
                value={form.charge_per_kg}
                onChange={(e) => setForm({ ...form, charge_per_kg: Number(e.target.value) })}
                placeholder="10"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSave} className="shadow-lg shadow-primary/20">{editing ? "আপডেট" : "সেভ"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourierCharges;
