import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, Plus, Trash2, RefreshCw, Webhook, CreditCard, ScrollText, Loader2 } from "lucide-react";

interface PaymentAccount {
  id: string;
  method: "bkash" | "nagad" | "rocket";
  account_number: string;
  account_type: "personal" | "merchant" | "agent";
  instructions_bn: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface SmsRow {
  id: string;
  raw_message: string;
  sender_address: string | null;
  provider: string | null;
  amount: number | null;
  txn_id: string | null;
  sender_number: string | null;
  received_at: string;
  status: string;
  matched_order_id: string | null;
}

const WEBHOOK_URL = `https://wqdirlxffyfplbhiadou.supabase.co/functions/v1/sms-webhook`;

export default function AdminPaymentGateway() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState({
    from: "bKash",
    message: "You have received Tk 500.00 from 01712345678. Fee Tk 0.00. Balance Tk 1500.00. TrxID AB12CD34EF at 12:34",
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: acc }, { data: ss }, { data: smsRows }] = await Promise.all([
      supabase.from("payment_accounts").select("*").order("sort_order"),
      supabase.from("site_settings").select("value").eq("key", "sms_webhook_secret").maybeSingle(),
      supabase.from("sms_inbox").select("*").order("received_at", { ascending: false }).limit(50),
    ]);
    setAccounts((acc || []) as PaymentAccount[]);
    setSecret((ss?.value || "").toString());
    setSms((smsRows || []) as SmsRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "কপি হয়েছে" });
    setTimeout(() => setCopied(null), 2000);
  };

  const upsertAccount = async (acc: Partial<PaymentAccount> & { method: PaymentAccount["method"] }) => {
    if (acc.id) {
      const { error } = await supabase.from("payment_accounts").update({
        account_number: acc.account_number,
        account_type: acc.account_type,
        instructions_bn: acc.instructions_bn,
        is_active: acc.is_active,
      }).eq("id", acc.id);
      if (error) return toast({ title: "সংরক্ষণ ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("payment_accounts").insert({
        method: acc.method,
        account_number: acc.account_number || "",
        account_type: acc.account_type || "personal",
        instructions_bn: acc.instructions_bn || null,
        is_active: acc.is_active ?? true,
        sort_order: accounts.length + 1,
      });
      if (error) return toast({ title: "সংরক্ষণ ব্যর্থ", description: error.message, variant: "destructive" });
    }
    toast({ title: "সংরক্ষিত হয়েছে" });
    loadAll();
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("payment_accounts").delete().eq("id", id);
    loadAll();
  };

  const regenerateSecret = async () => {
    if (!confirm("নতুন secret token তৈরি করলে পুরোনো webhook configuration বন্ধ হয়ে যাবে। নিশ্চিত?")) return;
    const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("site_settings").update({ value: newSecret }).eq("key", "sms_webhook_secret");
    if (error) return toast({ title: "ব্যর্থ", description: error.message, variant: "destructive" });
    setSecret(newSecret);
    toast({ title: "নতুন secret তৈরি হয়েছে" });
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-webhook-token": secret },
        body: JSON.stringify(testPayload),
      });
      const json = await res.json();
      setTestResult({ status: res.status, body: json });
      loadAll();
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">পেমেন্ট গেটওয়ে</h1>
        <p className="text-sm text-muted-foreground">bKash, Nagad ও Rocket account ও SMS-based auto-verification পরিচালনা করুন</p>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts"><CreditCard className="h-4 w-4 mr-1.5" />পেমেন্ট অ্যাকাউন্ট</TabsTrigger>
          <TabsTrigger value="webhook"><Webhook className="h-4 w-4 mr-1.5" />SMS Webhook</TabsTrigger>
          <TabsTrigger value="log"><ScrollText className="h-4 w-4 mr-1.5" />SMS লগ</TabsTrigger>
        </TabsList>

        {/* ACCOUNTS */}
        <TabsContent value="accounts" className="space-y-4">
          {(["bkash", "nagad", "rocket"] as const).map((m) => {
            const list = accounts.filter((a) => a.method === m);
            return (
              <Card key={m} className="p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold capitalize">{m}</h3>
                  <Button size="sm" variant="outline" onClick={() => setAccounts((prev) => [...prev, {
                    id: "", method: m, account_number: "", account_type: "personal",
                    instructions_bn: "", logo_url: null, is_active: true, sort_order: 0,
                  }])}>
                    <Plus className="h-4 w-4 mr-1" />নতুন
                  </Button>
                </div>
                <div className="space-y-3">
                  {list.length === 0 && <p className="text-sm text-muted-foreground">কোনো অ্যাকাউন্ট নেই</p>}
                  {list.map((acc, idx) => (
                    <AccountEditor
                      key={acc.id || `new-${idx}`}
                      account={acc}
                      onSave={upsertAccount}
                      onDelete={() => acc.id ? deleteAccount(acc.id) : setAccounts((p) => p.filter((x) => x !== acc))}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </TabsContent>

        {/* WEBHOOK */}
        <TabsContent value="webhook" className="space-y-4">
          <Card className="p-4 rounded-2xl space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide">Webhook URL</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={WEBHOOK_URL} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => handleCopy(WEBHOOK_URL, "url")}>
                  {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide">Secret Token (header: <code>x-webhook-token</code>)</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={secret} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => handleCopy(secret, "secret")}>
                  {copied === "secret" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={regenerateSecret}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2 bg-muted/40 p-3 rounded-lg">
              <p className="font-semibold text-foreground">Android SMS Forwarder সেটআপ:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>"SMS Forwarder" বা "SMS to URL" অ্যাপ ইনস্টল করুন</li>
                <li>Filter: Sender = "bKash", "Nagad", "Rocket" / "16216"</li>
                <li>Method: POST, Content-Type: application/json</li>
                <li>Header যোগ করুন: <code>x-webhook-token: {secret.slice(0, 12)}...</code></li>
                <li>Body template: <code>{`{"from":"%from%","message":"%text%"}`}</code></li>
              </ol>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl space-y-3">
            <h3 className="font-bold">Webhook Test</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <Input value={testPayload.from} onChange={(e) => setTestPayload({ ...testPayload, from: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Message (raw SMS body)</Label>
              <Textarea rows={3} value={testPayload.message} onChange={(e) => setTestPayload({ ...testPayload, message: e.target.value })} />
            </div>
            <Button onClick={runTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Test Webhook
            </Button>
            {testResult && (
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
            )}
          </Card>
        </TabsContent>

        {/* LOG */}
        <TabsContent value="log">
          <Card className="p-0 rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">সর্বশেষ ৫০টি SMS</h3>
              <Button size="sm" variant="outline" onClick={loadAll}>
                <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">সময়</th>
                    <th className="text-left p-3">Provider</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Sender</th>
                    <th className="text-left p-3">TxnID</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>}
                  {!loading && sms.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">কোনো SMS পাওয়া যায়নি</td></tr>}
                  {sms.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-xs">{new Date(s.received_at).toLocaleString("bn-BD")}</td>
                      <td className="p-3 capitalize">{s.provider || "—"}</td>
                      <td className="p-3 font-mono">{s.amount ? `৳${s.amount}` : "—"}</td>
                      <td className="p-3 font-mono text-xs">{s.sender_number || "—"}</td>
                      <td className="p-3 font-mono text-xs">{s.txn_id || "—"}</td>
                      <td className="p-3">
                        <Badge variant={s.status === "matched" ? "default" : s.status === "duplicate" ? "secondary" : s.status === "invalid" ? "destructive" : "outline"}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountEditor({
  account,
  onSave,
  onDelete,
}: {
  account: PaymentAccount;
  onSave: (a: Partial<PaymentAccount> & { method: PaymentAccount["method"] }) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(account);
  useEffect(() => setDraft(account), [account]);

  return (
    <div className="rounded-xl border p-3 space-y-3 bg-muted/20">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">নম্বর</Label>
          <Input value={draft.account_number} onChange={(e) => setDraft({ ...draft, account_number: e.target.value })} placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <Label className="text-xs">টাইপ</Label>
          <Select value={draft.account_type} onValueChange={(v) => setDraft({ ...draft, account_type: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <span className="text-sm">Active</span>
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">নির্দেশনা (বাংলা)</Label>
        <Textarea rows={2} value={draft.instructions_bn || ""} onChange={(e) => setDraft({ ...draft, instructions_bn: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(draft)}>সংরক্ষণ</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />ডিলিট
        </Button>
      </div>
    </div>
  );
}
