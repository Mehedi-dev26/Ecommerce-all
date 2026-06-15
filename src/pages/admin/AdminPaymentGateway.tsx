import { useEffect, useMemo, useState } from "react";
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
import {
  Copy, Check, Plus, Trash2, RefreshCw, Webhook, CreditCard, ScrollText,
  Loader2, Smartphone, Download, ExternalLink, Wifi, WifiOff, Radio,
  ShieldCheck, Info, Zap, BookOpen,
} from "lucide-react";

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

const METHOD_THEME: Record<PaymentAccount["method"], { name: string; gradient: string; accent: string; ring: string }> = {
  bkash:  { name: "bKash",  gradient: "from-pink-500 to-rose-600",     accent: "text-pink-600",   ring: "ring-pink-200" },
  nagad:  { name: "Nagad",  gradient: "from-orange-500 to-red-600",    accent: "text-orange-600", ring: "ring-orange-200" },
  rocket: { name: "Rocket", gradient: "from-purple-600 to-fuchsia-700", accent: "text-purple-600", ring: "ring-purple-200" },
};

const TEST_TEMPLATES = [
  { label: "bKash — টাকা গ্রহণ", from: "bKash",  message: "You have received Tk 500.00 from 01712345678. Fee Tk 0.00. Balance Tk 1500.00. TrxID AB12CD34EF at 12:34" },
  { label: "Nagad — টাকা গ্রহণ", from: "NAGAD",  message: "Cash In Tk 1000.00 from 01812345678 successful. TxnID: 78XY9ZQW12. Balance: Tk 5000.00" },
  { label: "Rocket — টাকা গ্রহণ", from: "16216", message: "Tk500.00 received from A/C:01912345678. TrxID 7K8L9M0N1P. Bal Tk2500.00" },
];

const RECOMMENDED_APPS = [
  {
    name: "SMS Forwarder (Open Source)",
    author: "@bogkonstantin",
    desc: "সবচাইতে নির্ভরযোগ্য — Custom Header, JSON Body, Filter এবং Retry সব support করে। সম্পূর্ণ বিনামূল্যে এবং কোনো বিজ্ঞাপন নেই।",
    play: "https://play.google.com/store/apps/details?id=tech.bogomolov.incomingsmsgateway",
    github: "https://github.com/bogkonstantin/android_income_sms_gateway_webhook",
    badge: "সর্বাধিক প্রস্তাবিত",
  },
  {
    name: "SMS to Telegram / Webhook",
    author: "by Hayven",
    desc: "Multiple webhook destinations support করে — bKash, Nagad আলাদা rule দিয়ে route করা যায়।",
    play: "https://play.google.com/store/apps/details?id=com.hayven.smstotelegram",
    badge: "Alternative",
  },
];

export default function AdminPaymentGateway() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState(TEST_TEMPLATES[0]);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [liveProbeAt, setLiveProbeAt] = useState<number | null>(null);

  const loadAll = async () => {
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
    const interval = setInterval(loadAll, 8000);
    return () => clearInterval(interval);
  }, []);

  // Live connection status: based on most recent SMS in the last 10 minutes
  const liveStatus = useMemo(() => {
    if (sms.length === 0) return { online: false, lastSeen: null as Date | null, ageMin: Infinity };
    const last = new Date(sms[0].received_at);
    const ageMs = Date.now() - last.getTime();
    return { online: ageMs < 10 * 60 * 1000, lastSeen: last, ageMin: Math.floor(ageMs / 60000) };
  }, [sms]);

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
        logo_url: acc.logo_url,
        is_active: acc.is_active,
      }).eq("id", acc.id);
      if (error) return toast({ title: "সংরক্ষণ ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("payment_accounts").insert({
        method: acc.method,
        account_number: acc.account_number || "",
        account_type: acc.account_type || "personal",
        instructions_bn: acc.instructions_bn || null,
        logo_url: acc.logo_url || null,
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
        body: JSON.stringify({ from: testPayload.from, message: testPayload.message }),
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

  // Live device probe: snapshot the latest SMS id, then wait 90s for a new one
  const probeLiveDevice = () => {
    const snapshotId = sms[0]?.id || null;
    setLiveProbeAt(Date.now());
    toast({ title: "প্রোব শুরু হয়েছে", description: "আপনার ফোনে এখন একটি Test SMS পাঠান (যেকোনো নম্বর থেকে নিজের ফোনে)। ৯০ সেকেন্ড অপেক্ষা..." });
    const started = Date.now();
    const t = setInterval(async () => {
      const { data } = await supabase.from("sms_inbox").select("id, received_at").order("received_at", { ascending: false }).limit(1);
      const newest = data?.[0];
      if (newest && newest.id !== snapshotId) {
        clearInterval(t);
        setLiveProbeAt(null);
        loadAll();
        toast({ title: "✅ ফোন সংযুক্ত!", description: "নতুন SMS webhook এ পৌঁছেছে।" });
      } else if (Date.now() - started > 90_000) {
        clearInterval(t);
        setLiveProbeAt(null);
        toast({ title: "⏱ Timeout", description: "৯০ সেকেন্ডে কোনো নতুন SMS আসেনি। অ্যাপ configuration check করুন।", variant: "destructive" });
      }
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header with live status */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            পেমেন্ট গেটওয়ে
          </h1>
          <p className="text-sm text-muted-foreground">bKash, Nagad ও Rocket account এবং SMS-based auto-verification</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${liveStatus.online ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`}>
          {liveStatus.online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {liveStatus.online ? "ফোন সংযুক্ত — Live" : sms.length === 0 ? "কোনো SMS আসেনি" : `শেষ SMS: ${liveStatus.ageMin} মিনিট আগে`}
          </span>
        </div>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="accounts"><CreditCard className="h-4 w-4 mr-1.5" />অ্যাকাউন্ট</TabsTrigger>
          <TabsTrigger value="webhook"><Webhook className="h-4 w-4 mr-1.5" />SMS Webhook</TabsTrigger>
          <TabsTrigger value="log"><ScrollText className="h-4 w-4 mr-1.5" />SMS লগ</TabsTrigger>
        </TabsList>

        {/* ACCOUNTS */}
        <TabsContent value="accounts" className="space-y-4">
          {(["bkash", "nagad", "rocket"] as const).map((m) => {
            const theme = METHOD_THEME[m];
            const list = accounts.filter((a) => a.method === m);
            return (
              <Card key={m} className="rounded-2xl overflow-hidden border-0 shadow-sm">
                <div className={`bg-gradient-to-r ${theme.gradient} px-5 py-4 flex items-center justify-between text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
                      {theme.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{theme.name}</h3>
                      <p className="text-xs text-white/80">{list.length}টি অ্যাকাউন্ট • {list.filter(x => x.is_active).length}টি Active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur" onClick={() => setAccounts((prev) => [...prev, {
                    id: "", method: m, account_number: "", account_type: "personal",
                    instructions_bn: "", logo_url: null, is_active: true, sort_order: 0,
                  }])}>
                    <Plus className="h-4 w-4 mr-1" />নতুন
                  </Button>
                </div>
                <div className="p-4 space-y-3 bg-card">
                  {list.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      এখনো কোনো {theme.name} অ্যাকাউন্ট যোগ করা হয়নি
                    </div>
                  )}
                  {list.map((acc, idx) => (
                    <AccountEditor
                      key={acc.id || `new-${idx}`}
                      account={acc}
                      theme={theme}
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
          {/* Introduction */}
          <Card className="rounded-2xl overflow-hidden border-0 shadow-sm">
            <div className="bg-gradient-to-br from-primary to-primary/70 px-6 py-5 text-primary-foreground">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">SMS Webhook কী এবং কীভাবে কাজ করে?</h2>
                  <p className="text-sm text-white/90 leading-relaxed">
                    আপনার Android ফোনে আসা bKash/Nagad/Rocket এর payment confirmation SMS গুলো একটি ছোট অ্যাপ এর মাধ্যমে এই সার্ভারে forward হবে। সার্ভার নিজে থেকে amount, sender number এবং Transaction ID মিলিয়ে অর্ডার auto-verify করে দিবে। কোনো manual কাজ নেই — গ্রাহক payment করলে কয়েক সেকেন্ডের মধ্যে অর্ডার confirm।
                  </p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
              {[
                { icon: Smartphone, title: "১. অ্যাপ ইন্সটল", desc: "নিচের যেকোনো একটি SMS Forwarder অ্যাপ ফোনে ইন্সটল করুন" },
                { icon: ShieldCheck, title: "২. URL + Token", desc: "নিচের Webhook URL ও Secret Token অ্যাপে paste করুন" },
                { icon: Radio,       title: "৩. Live Test", desc: "Probe বাটনে চাপ দিন এবং নিজে একটি test SMS পাঠান" },
              ].map((s, i) => (
                <div key={i} className="p-4 flex items-start gap-3 bg-card">
                  <s.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended Apps */}
          <Card className="rounded-2xl p-5 space-y-3 border-0 shadow-sm">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="font-bold">প্রস্তাবিত Android অ্যাপ</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {RECOMMENDED_APPS.map((app) => (
                <div key={app.name} className="rounded-xl border p-4 space-y-2 bg-muted/20 hover:bg-muted/40 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm">{app.name}</h4>
                      <p className="text-xs text-muted-foreground">{app.author}</p>
                    </div>
                    <Badge variant={app.badge.includes("সর্বাধিক") ? "default" : "secondary"} className="text-[10px] shrink-0">{app.badge}</Badge>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{app.desc}</p>
                  <div className="flex gap-2 pt-1">
                    <a href={app.play} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />Play Store
                    </a>
                    {app.github && (
                      <a href={app.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" />GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Configuration */}
          <Card className="rounded-2xl p-5 space-y-4 border-0 shadow-sm">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Webhook Configuration</h3>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Webhook URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input readOnly value={WEBHOOK_URL} className="font-mono text-xs bg-muted/30" />
                <Button variant="outline" size="icon" onClick={() => handleCopy(WEBHOOK_URL, "url")}>
                  {copied === "url" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Secret Token (header: <code className="text-primary">x-webhook-token</code>)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input readOnly value={secret} className="font-mono text-xs bg-muted/30" />
                <Button variant="outline" size="icon" onClick={() => handleCopy(secret, "secret")}>
                  {copied === "secret" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={regenerateSecret} title="নতুন secret তৈরি করুন">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-gradient-to-br from-muted/40 to-muted/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <BookOpen className="h-4 w-4" /> অ্যাপে যা যা set করবেন
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
                <li>URL: উপরের Webhook URL paste করুন</li>
                <li>Method: <code className="bg-background px-1.5 py-0.5 rounded">POST</code></li>
                <li>Header: <code className="bg-background px-1.5 py-0.5 rounded">Content-Type: application/json</code></li>
                <li>Header: <code className="bg-background px-1.5 py-0.5 rounded">x-webhook-token: {secret ? secret.slice(0, 16) + "…" : "(উপরের token)"}</code></li>
                <li>Filter (Sender): <code className="bg-background px-1.5 py-0.5 rounded">bKash, NAGAD, 16216, Rocket</code></li>
                <li>Body (JSON):
                  <pre className="mt-1 bg-background border rounded-lg p-2 text-xs overflow-auto">{`{"from":"%from%","message":"%text%","sentStamp":"%sentStamp%"}`}</pre>
                </li>
              </ol>
            </div>
          </Card>

          {/* Live Device Probe */}
          <Card className="rounded-2xl p-5 space-y-3 border-0 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Radio className={`h-5 w-5 ${liveStatus.online ? "text-emerald-600" : "text-muted-foreground"}`} />
                <h3 className="font-bold">Live Connection Test</h3>
              </div>
              <Button onClick={probeLiveDevice} disabled={!!liveProbeAt} variant="default">
                {liveProbeAt ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Probing... ফোনে SMS পাঠান</> : <><Radio className="h-4 w-4 mr-2" />Start Live Probe</>}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              এই বাটনে চাপ দিন, তারপর আপনার ফোনে যেকোনো নম্বর থেকে একটি test SMS পাঠান। ফোন থেকে SMS আমাদের server এ পৌঁছালে সাথে সাথে notification আসবে।
            </p>
            <div className={`rounded-xl border p-4 ${liveStatus.online ? "bg-emerald-50 border-emerald-200" : "bg-muted/30"}`}>
              <div className="flex items-center gap-3">
                {liveStatus.online ? <Wifi className="h-8 w-8 text-emerald-600" /> : <WifiOff className="h-8 w-8 text-muted-foreground" />}
                <div>
                  <p className="font-semibold">{liveStatus.online ? "ফোন Active — SMS forwarding চলছে" : "ফোন থেকে সাম্প্রতিক কোনো SMS আসেনি"}</p>
                  <p className="text-xs text-muted-foreground">
                    {liveStatus.lastSeen ? `শেষ SMS: ${liveStatus.lastSeen.toLocaleString("bn-BD")}` : "এখনো কোনো SMS পাওয়া যায়নি"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Simulated Webhook Test */}
          <Card className="rounded-2xl p-5 space-y-3 border-0 shadow-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Simulated SMS Test</h3>
            </div>
            <p className="text-sm text-muted-foreground">ফোন ছাড়াই server এ একটি fake SMS পাঠিয়ে parsing logic যাচাই করুন।</p>
            <div className="flex flex-wrap gap-2">
              {TEST_TEMPLATES.map((tpl) => (
                <Button key={tpl.label} size="sm" variant={testPayload.label === tpl.label ? "default" : "outline"} onClick={() => setTestPayload(tpl)}>
                  {tpl.label}
                </Button>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">From (sender)</Label>
                <Input value={testPayload.from} onChange={(e) => setTestPayload({ ...testPayload, from: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Message body</Label>
                <Textarea rows={3} value={testPayload.message} onChange={(e) => setTestPayload({ ...testPayload, message: e.target.value })} />
              </div>
            </div>
            <Button onClick={runTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
            {testResult && (
              <div className={`rounded-xl border p-3 ${testResult.status === 200 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <p className="text-sm font-semibold mb-2">
                  {testResult.status === 200 ? "✅ Success" : "❌ Failed"} {testResult.status && `(HTTP ${testResult.status})`}
                </p>
                <pre className="text-xs overflow-auto bg-background/50 p-2 rounded">{JSON.stringify(testResult.body || testResult.error, null, 2)}</pre>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* LOG */}
        <TabsContent value="log">
          <Card className="p-0 rounded-2xl overflow-hidden border-0 shadow-sm">
            <div className="p-4 border-b flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold">সর্বশেষ ৫০টি SMS</h3>
                <p className="text-xs text-muted-foreground">প্রতি ৮ সেকেন্ডে auto refresh</p>
              </div>
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
                  {!loading && sms.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">কোনো SMS পাওয়া যায়নি। ফোনের অ্যাপ চালু আছে কি?</td></tr>}
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
  theme,
  onSave,
  onDelete,
}: {
  account: PaymentAccount;
  theme: { name: string; gradient: string; accent: string; ring: string };
  onSave: (a: Partial<PaymentAccount> & { method: PaymentAccount["method"] }) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(account);
  const [uploading, setUploading] = useState(false);
  useEffect(() => setDraft(account), [account]);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `payment-logos/${draft.method}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setDraft({ ...draft, logo_url: data.publicUrl });
      toast({ title: "লোগো আপলোড হয়েছে — সংরক্ষণ চাপুন" });
    } catch (e: any) {
      toast({ title: "আপলোড ব্যর্থ", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 bg-background ${draft.is_active ? `ring-2 ${theme.ring}` : "opacity-70"}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center bg-white overflow-hidden relative shadow-sm`}>
            {draft.logo_url ? (
              <img src={draft.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className={`text-xs font-bold ${theme.accent}`}>{theme.name}</span>
            )}
            {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>}
          </div>
          <label className="block mt-1.5 text-[10px] text-center text-primary cursor-pointer hover:underline">
            Logo পরিবর্তন
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
          </label>
        </div>
        <div className="flex-1 grid sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">নম্বর</Label>
            <Input value={draft.account_number} onChange={(e) => setDraft({ ...draft, account_number: e.target.value })} placeholder="01XXXXXXXXX" className="font-mono" />
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
          <div className="flex items-end">
            <div className="flex items-center gap-2 h-10">
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              <span className="text-sm font-medium">{draft.is_active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">গ্রাহকের জন্য নির্দেশনা (বাংলা)</Label>
        <Textarea rows={2} value={draft.instructions_bn || ""} onChange={(e) => setDraft({ ...draft, instructions_bn: e.target.value })} placeholder="যেমন: Send Money অপশন থেকে উপরের নম্বরে টাকা পাঠান এবং Transaction ID দিন" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />ডিলিট
        </Button>
        <Button size="sm" onClick={() => onSave(draft)} className={`bg-gradient-to-r ${theme.gradient} text-white border-0 hover:opacity-90`}>
          সংরক্ষণ
        </Button>
      </div>
    </div>
  );
}
