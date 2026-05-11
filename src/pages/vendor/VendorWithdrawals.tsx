import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Banknote } from "lucide-react";

const formatBDT = (n: number) => `৳${Math.round(n).toLocaleString("bn-BD")}`;

const statusInfo: Record<string, { label: string; variant: any }> = {
  pending: { label: "অপেক্ষমাণ", variant: "secondary" },
  approved: { label: "অনুমোদিত", variant: "default" },
  paid: { label: "পরিশোধিত", variant: "default" },
  rejected: { label: "প্রত্যাখ্যাত", variant: "destructive" },
};

const VendorWithdrawals = () => {
  const { vendor } = useVendor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bkash");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["vendor-balance", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const [itemsRes, payoutsRes] = await Promise.all([
        supabase
          .from("order_items" as any)
          .select("vendor_payout_amount, orders:order_id(status)")
          .eq("vendor_id", vendor!.id),
        supabase.from("vendor_payouts" as any).select("amount, status").eq("vendor_id", vendor!.id),
      ]);
      const earned = (itemsRes.data || []).reduce(
        (s: number, it: any) => (it.orders?.status === "delivered" ? s + Number(it.vendor_payout_amount || 0) : s),
        0
      );
      const used = (payoutsRes.data || []).reduce(
        (s: number, p: any) => (p.status !== "rejected" ? s + Number(p.amount || 0) : s),
        0
      );
      return earned - used;
    },
  });

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["vendor-payouts", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_payouts" as any)
        .select("*")
        .eq("vendor_id", vendor!.id)
        .order("requested_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const handleRequest = async () => {
    if (!vendor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "ত্রুটি", description: "সঠিক পরিমাণ দিন", variant: "destructive" });
      return;
    }
    if (amt > (balance || 0)) {
      toast({ title: "ত্রুটি", description: "আপনার ব্যালেন্স যথেষ্ট নয়", variant: "destructive" });
      return;
    }
    if (!account) {
      toast({ title: "ত্রুটি", description: "অ্যাকাউন্ট নাম্বার দিন", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("vendor_payouts" as any).insert({
        vendor_id: vendor.id,
        amount: amt,
        method,
        payout_account: account,
        vendor_notes: notes || null,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "✅ অনুরোধ জমা হয়েছে" });
      setOpen(false);
      setAmount(""); setAccount(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["vendor-payouts"] });
      qc.invalidateQueries({ queryKey: ["vendor-balance"] });
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">টাকা উত্তোলন</h1>
          <p className="text-muted-foreground text-sm mt-1">আপনার আয় উত্তোলনের অনুরোধ</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1.5" /> নতুন অনুরোধ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>উত্তোলনের অনুরোধ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                বর্তমান ব্যালেন্স: <span className="font-bold text-green-700">{formatBDT(balance || 0)}</span>
              </div>
              <div>
                <Label>পরিমাণ (৳) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>পদ্ধতি *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>অ্যাকাউন্ট/মোবাইল নাম্বার *</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="01XXXXXXXXX অথবা ব্যাংক A/C" />
              </div>
              <div>
                <Label>মন্তব্য (ঐচ্ছিক)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
                <Button onClick={handleRequest} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  জমা দিন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">উত্তোলনযোগ্য ব্যালেন্স</p>
          <p className="text-3xl font-bold text-green-700">{formatBDT(balance || 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b"><h2 className="font-bold">অনুরোধের ইতিহাস</h2></div>
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : !payouts?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">এখনো কোনো অনুরোধ নেই</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>পরিমাণ</TableHead>
                    <TableHead>পদ্ধতি</TableHead>
                    <TableHead>অ্যাকাউন্ট</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead>রেফারেন্স</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p: any) => {
                    const st = statusInfo[p.status] || { label: p.status, variant: "secondary" };
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{new Date(p.requested_at).toLocaleDateString("bn-BD")}</TableCell>
                        <TableCell className="font-bold">{formatBDT(p.amount)}</TableCell>
                        <TableCell className="text-xs uppercase">{p.method}</TableCell>
                        <TableCell className="text-xs">{p.payout_account}</TableCell>
                        <TableCell><Badge variant={st.variant} className="text-[10px]">{st.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.transaction_ref || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorWithdrawals;
