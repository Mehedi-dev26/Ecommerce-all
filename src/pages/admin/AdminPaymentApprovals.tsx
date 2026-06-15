import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw, Copy, Phone,
  Inbox, ShieldCheck, AlertCircle, Hash, Wallet, ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PendingOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  advance_amount: number | null;
  payment_provider: string | null;
  payment_sender_number: string | null;
  payment_txn_id: string | null;
  payment_expected_amount: number | null;
  payment_verified_at: string | null;
  advance_paid: boolean | null;
  status: string;
  created_at: string;
}

interface SmsEntry {
  id: string;
  raw_message: string;
  provider: string | null;
  amount: number | null;
  txn_id: string | null;
  sender_number: string | null;
  received_at: string;
  status: string;
  matched_order_id: string | null;
  matched_at: string | null;
}

const providerColor = (p: string | null) => {
  switch (p) {
    case "bkash": return "bg-pink-100 text-pink-700 border-pink-200";
    case "nagad": return "bg-orange-100 text-orange-700 border-orange-200";
    case "rocket": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-muted text-muted-foreground";
  }
};

const fmtBDT = (n: number | null | undefined) =>
  `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘন্টা আগে`;
  return `${Math.floor(h / 24)} দিন আগে`;
};

export default function AdminPaymentApprovals() {
  const [tab, setTab] = useState<"pending" | "verified" | "sms">("pending");
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [verified, setVerified] = useState<PendingOrder[]>([]);
  const [sms, setSms] = useState<SmsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const [pendingRes, verifiedRes, smsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, total, advance_amount, payment_provider, payment_sender_number, payment_txn_id, payment_expected_amount, payment_verified_at, advance_paid, status, created_at")
          .not("payment_provider", "is", null)
          .neq("payment_provider", "cod")
          .is("payment_verified_at", null)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, total, advance_amount, payment_provider, payment_sender_number, payment_txn_id, payment_expected_amount, payment_verified_at, advance_paid, status, created_at")
          .not("payment_verified_at", "is", null)
          .order("payment_verified_at", { ascending: false })
          .limit(50),
        supabase
          .from("sms_inbox")
          .select("*")
          .order("received_at", { ascending: false })
          .limit(100),
      ]);
      setOrders((pendingRes.data as PendingOrder[]) || []);
      setVerified((verifiedRes.data as PendingOrder[]) || []);
      setSms((smsRes.data as SmsEntry[]) || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Realtime: refresh when orders or sms change
  useEffect(() => {
    const ch = supabase
      .channel("payment-approvals")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_inbox" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const approve = async (o: PendingOrder) => {
    const isAdvance = Number(o.advance_amount || 0) > 0 && Number(o.advance_amount) < Number(o.total);
    const updates: Record<string, unknown> = {
      payment_verified_at: new Date().toISOString(),
    };
    if (isAdvance) updates.advance_paid = true;
    const { error } = await supabase.from("orders").update(updates).eq("id", o.id);
    if (error) return toast({ title: "Approve ব্যর্থ", description: error.message, variant: "destructive" });
    toast({ title: "পেমেন্ট approve হয়েছে ✅", description: `Order ${o.order_number}` });
    load();
  };

  const reject = async (o: PendingOrder) => {
    if (!confirm(`Order ${o.order_number} এর পেমেন্ট তথ্য মুছে দেবেন? গ্রাহক আবার transaction ID পাঠাতে পারবে।`)) return;
    const { error } = await supabase
      .from("orders")
      .update({ payment_txn_id: null, payment_sender_number: null })
      .eq("id", o.id);
    if (error) return toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    toast({ title: "তথ্য মুছে ফেলা হয়েছে" });
    load();
  };

  const matchSmsToOrder = async (smsRow: SmsEntry, orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const isAdvance = Number(order.advance_amount || 0) > 0 && Number(order.advance_amount) < Number(order.total);
    const updates: Record<string, unknown> = {
      payment_txn_id: smsRow.txn_id,
      payment_verified_at: new Date().toISOString(),
    };
    if (isAdvance) updates.advance_paid = true;
    const { error: e1 } = await supabase.from("orders").update(updates).eq("id", orderId);
    if (e1) return toast({ title: "Match ব্যর্থ", description: e1.message, variant: "destructive" });
    await supabase
      .from("sms_inbox")
      .update({ status: "matched", matched_order_id: orderId, matched_at: new Date().toISOString() })
      .eq("id", smsRow.id);
    toast({ title: "SMS অর্ডারের সাথে যুক্ত হয়েছে ✅" });
    load();
  };

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast({ title: "কপি হয়েছে", description: v });
  };

  const filtered = useMemo(() => {
    const list = tab === "pending" ? orders : tab === "verified" ? verified : [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((o) =>
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_phone || "").includes(q) ||
      (o.payment_txn_id || "").toLowerCase().includes(q) ||
      (o.payment_sender_number || "").includes(q)
    );
  }, [tab, orders, verified, search]);

  const filteredSms = useMemo(() => {
    if (!search.trim()) return sms;
    const q = search.toLowerCase();
    return sms.filter((s) =>
      (s.txn_id || "").toLowerCase().includes(q) ||
      (s.sender_number || "").includes(q) ||
      (s.raw_message || "").toLowerCase().includes(q)
    );
  }, [sms, search]);

  const stats = useMemo(() => ({
    pending: orders.length,
    verifiedToday: verified.filter((o) => {
      const t = new Date(o.payment_verified_at!).getTime();
      return Date.now() - t < 86400000;
    }).length,
    unmatchedSms: sms.filter((s) => s.status === "unmatched").length,
  }), [orders, verified, sms]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/payment-gateway" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              পেমেন্ট Approval
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              SMS Webhook থেকে আসা পেমেন্ট auto-approve হয় — যেগুলো match হয়নি সেগুলো এখান থেকে manually approve করুন।
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2"><Clock className="h-4 w-4 text-amber-700" /></div>
            <div>
              <div className="text-[10px] text-amber-700 font-medium">Pending Approval</div>
              <div className="text-xl font-bold text-amber-900">{stats.pending}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /></div>
            <div>
              <div className="text-[10px] text-emerald-700 font-medium">Approved (24h)</div>
              <div className="text-xl font-bold text-emerald-900">{stats.verifiedToday}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2"><Inbox className="h-4 w-4 text-blue-700" /></div>
            <div>
              <div className="text-[10px] text-blue-700 font-medium">Unmatched SMS</div>
              <div className="text-xl font-bold text-blue-900">{stats.unmatchedSms}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        {([
          { k: "pending", label: `Pending (${stats.pending})`, icon: Clock },
          { k: "verified", label: "Approved", icon: CheckCircle2 },
          { k: "sms", label: `SMS Inbox (${sms.length})`, icon: Inbox },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 -mb-px transition",
              tab === t.k ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Order #, নাম, ফোন, transaction ID খুঁজুন…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে…</div>
      ) : tab === "sms" ? (
        <div className="space-y-2">
          {filteredSms.length === 0 ? (
            <Empty msg="কোনো SMS পাওয়া যায়নি" />
          ) : filteredSms.map((s) => (
            <Card key={s.id} className={cn("border", s.status === "matched" && "bg-emerald-50/40 border-emerald-200")}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <Badge variant="outline" className={providerColor(s.provider)}>
                    {s.provider?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                  <Badge variant={s.status === "matched" ? "default" : s.status === "duplicate" ? "secondary" : "outline"}>
                    {s.status}
                  </Badge>
                  <span className="text-muted-foreground">{timeAgo(s.received_at)}</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  <Field label="Amount" value={fmtBDT(s.amount)} mono />
                  <Field label="Sender" value={s.sender_number || "—"} mono onCopy={s.sender_number ? () => copy(s.sender_number!) : undefined} />
                  <Field label="TxnID" value={s.txn_id || "—"} mono onCopy={s.txn_id ? () => copy(s.txn_id!) : undefined} />
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/40 rounded p-2 leading-snug whitespace-pre-wrap">
                  {s.raw_message}
                </p>
                {s.status === "unmatched" && orders.length > 0 && (
                  <div className="pt-1 border-t">
                    <div className="text-[10px] text-muted-foreground mb-1">এই SMS কে কোন order এর সাথে match করবেন?</div>
                    <div className="flex flex-wrap gap-1">
                      {orders.slice(0, 6).map((o) => (
                        <button
                          key={o.id}
                          onClick={() => matchSmsToOrder(s, o.id)}
                          className="text-[11px] px-2 py-1 rounded border bg-background hover:bg-primary hover:text-primary-foreground transition"
                        >
                          {o.order_number} · {fmtBDT(o.payment_expected_amount || o.total)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Empty msg={tab === "pending" ? "🎉 সব পেমেন্ট approve হয়ে গেছে!" : "এখনো কোনো পেমেন্ট approve হয়নি"} />
          ) : filtered.map((o) => {
            const isAdvance = Number(o.advance_amount || 0) > 0 && Number(o.advance_amount) < Number(o.total);
            const expected = o.payment_expected_amount || (isAdvance ? o.advance_amount : o.total) || 0;
            return (
              <Card key={o.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[1fr_auto] gap-3 p-3">
                    {/* Left – details */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{o.order_number}</span>
                        <Badge variant="outline" className={providerColor(o.payment_provider)}>
                          {o.payment_provider?.toUpperCase()}
                        </Badge>
                        {isAdvance && <Badge variant="secondary" className="text-[10px]">Advance {fmtBDT(o.advance_amount)} / {fmtBDT(o.total)}</Badge>}
                        {!isAdvance && <Badge variant="secondary" className="text-[10px]">Full {fmtBDT(o.total)}</Badge>}
                        <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(o.created_at)}</span>
                      </div>

                      <div className="text-xs space-y-0.5">
                        <div className="font-medium">{o.customer_name}</div>
                        <a href={`tel:${o.customer_phone}`} className="text-muted-foreground flex items-center gap-1 hover:text-primary">
                          <Phone className="h-3 w-3" /> {o.customer_phone}
                        </a>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                        <Field label="Expected" value={fmtBDT(expected)} mono />
                        <Field
                          label="Sender No."
                          value={o.payment_sender_number || "—"}
                          mono
                          onCopy={o.payment_sender_number ? () => copy(o.payment_sender_number!) : undefined}
                        />
                        <Field
                          label="Transaction ID"
                          value={o.payment_txn_id || "— গ্রাহক এখনো পাঠায়নি —"}
                          mono
                          highlight={!!o.payment_txn_id}
                          onCopy={o.payment_txn_id ? () => copy(o.payment_txn_id!) : undefined}
                        />
                      </div>

                      {!o.payment_txn_id && tab === "pending" && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          <AlertCircle className="h-3 w-3" />
                          গ্রাহক এখনো Transaction ID submit করেনি। তারা আবার submit করলে এখানে দেখাবে।
                        </div>
                      )}
                    </div>

                    {/* Right – actions */}
                    {tab === "pending" && (
                      <div className="flex md:flex-col gap-2 md:w-36">
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => approve(o)}
                          disabled={!o.payment_txn_id}
                          title={!o.payment_txn_id ? "Transaction ID ছাড়া approve করা যাবে না" : ""}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => reject(o)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {tab === "verified" && (
                      <div className="md:w-36 flex items-center justify-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {o.payment_verified_at ? timeAgo(o.payment_verified_at) : "Approved"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono, highlight, onCopy }: { label: string; value: string; mono?: boolean; highlight?: boolean; onCopy?: () => void }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn(
        "flex items-center gap-1 rounded border px-2 py-1 bg-background",
        mono && "font-mono text-xs",
        highlight && "border-primary/40 bg-primary/5"
      )}>
        <span className="truncate flex-1">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-primary">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
      {msg}
    </div>
  );
}
