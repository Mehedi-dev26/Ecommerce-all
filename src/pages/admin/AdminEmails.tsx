import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { sendEmail } from "@/lib/sendEmail";
import {
  Mail, Send, Users, FileText, History, Search, Eye, Edit3,
  CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw,
} from "lucide-react";

interface Template {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  subject: string;
  html_body: string;
  is_active: boolean;
  is_system: boolean;
  updated_at: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_key: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Customer {
  email: string;
  name: string;
}

const TEMPLATE_VARIABLE_HINTS: Record<string, string[]> = {
  welcome_signup: ["customer_name"],
  order_confirmation: ["customer_name", "order_code", "order_subtotal", "order_shipping", "order_total", "shipping_address", "items_html"],
  first_order_thanks: ["customer_name", "order_code", "order_total"],
  order_status_update: ["customer_name", "order_code", "order_status", "status_message"],
  custom_admin: ["customer_name", "custom_subject", "custom_message"],
};

const AdminEmails = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("send");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            ইমেইল সেন্টার
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Email Center — গ্রাহকদের সাথে যোগাযোগের সম্পূর্ণ সিস্টেম
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/50">
          <TabsTrigger value="send" className="gap-2 py-2.5">
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span> Single
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2 py-2.5">
            <Users className="h-4 w-4" /> Bulk Send
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 py-2.5">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 py-2.5">
            <History className="h-4 w-4" /> Email Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send"><SendSingleTab /></TabsContent>
        <TabsContent value="bulk"><BulkSendTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

/* ---------------- Send Single Tab ---------------- */
const SendSingleTab = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [templateKey, setTemplateKey] = useState("custom_admin");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      const [tplRes, custRes] = await Promise.all([
        supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
        supabase
          .from("orders")
          .select("customer_email, customer_name")
          .not("customer_email", "is", null)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setTemplates(tplRes.data || []);
      // Dedupe by email
      const seen = new Set<string>();
      const unique: Customer[] = [];
      (custRes.data || []).forEach((o: any) => {
        const e = (o.customer_email || "").toLowerCase().trim();
        if (e && !seen.has(e)) {
          seen.add(e);
          unique.push({ email: e, name: o.customer_name || "" });
        }
      });
      setCustomers(unique);
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers.slice(0, 50);
    return customers
      .filter((c) => c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [customers, customerSearch]);

  const handleSend = async () => {
    if (!selectedEmail) {
      toast({ title: "ত্রুটি", description: "একজন কাস্টমার নির্বাচন করুন", variant: "destructive" });
      return;
    }
    if (mode === "custom" && (!customSubject.trim() || !customMessage.trim())) {
      toast({ title: "ত্রুটি", description: "বিষয় ও বার্তা পূরণ করুন", variant: "destructive" });
      return;
    }
    setSending(true);
    const variables: Record<string, string> = {
      customer_name: selectedName || "গ্রাহক",
    };
    if (mode === "custom" || templateKey === "custom_admin") {
      variables.custom_subject = customSubject || "আপনার জন্য একটি বার্তা";
      variables.custom_message = customMessage.replace(/\n/g, "<br/>");
    }
    const { data: { user } } = await supabase.auth.getUser();
    const result = await sendEmail({
      templateKey: mode === "template" ? templateKey : "custom_admin",
      recipients: [{ email: selectedEmail, name: selectedName }],
      variables,
      sentBy: user?.id || null,
    });
    setSending(false);
    if (result.success && result.sent > 0) {
      toast({ title: "✅ ইমেইল পাঠানো হয়েছে", description: selectedEmail });
      setCustomSubject("");
      setCustomMessage("");
    } else {
      toast({ title: "❌ ব্যর্থ", description: result.error || "ইমেইল পাঠানো যায়নি", variant: "destructive" });
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">📤 একজন কাস্টমারকে ইমেইল পাঠান</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>কাস্টমার নির্বাচন</Label>
          <Input
            placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="mt-2"
          />
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border bg-muted/20">
            {filteredCustomers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">কোনো কাস্টমার পাওয়া যায়নি</p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.email}
                  onClick={() => { setSelectedEmail(c.email); setSelectedName(c.name); }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors flex items-center justify-between border-b last:border-b-0 ${
                    selectedEmail === c.email ? "bg-primary/15 font-medium" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium">{c.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                  {selectedEmail === c.email && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))
            )}
          </div>
          {selectedEmail && (
            <div className="mt-2 text-xs text-primary font-medium">
              ✓ নির্বাচিত: {selectedName} ({selectedEmail})
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">মোড:</span>
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "template" ? "default" : "outline"} onClick={() => setMode("template")}>
              টেমপ্লেট
            </Button>
            <Button size="sm" variant={mode === "custom" ? "default" : "outline"} onClick={() => setMode("custom")}>
              কাস্টম মেসেজ
            </Button>
          </div>
        </div>

        {mode === "template" ? (
          <div>
            <Label>টেমপ্লেট নির্বাচন করুন</Label>
            <Select value={templateKey} onValueChange={setTemplateKey}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.template_key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateKey === "custom_admin" && (
              <div className="mt-3 space-y-2">
                <Input placeholder="বিষয় (Subject)" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
                <Textarea placeholder="আপনার বার্তা..." value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={6} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>বিষয়</Label>
            <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="ইমেইলের বিষয়..." />
            <Label className="mt-3 block">বার্তা</Label>
            <Textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="আপনার সম্পূর্ণ বার্তা লিখুন..." rows={8} />
          </div>
        )}

        <Button onClick={handleSend} disabled={sending || !selectedEmail} className="w-full gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          ইমেইল পাঠান
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------------- Bulk Send Tab ---------------- */
const BulkSendTab = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templateKey, setTemplateKey] = useState("custom_admin");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });

  useEffect(() => {
    void (async () => {
      const [tplRes, custRes] = await Promise.all([
        supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
        supabase
          .from("orders")
          .select("customer_email, customer_name")
          .not("customer_email", "is", null)
          .limit(2000),
      ]);
      setTemplates(tplRes.data || []);
      const seen = new Set<string>();
      const unique: Customer[] = [];
      (custRes.data || []).forEach((o: any) => {
        const e = (o.customer_email || "").toLowerCase().trim();
        if (e && !seen.has(e)) {
          seen.add(e);
          unique.push({ email: e, name: o.customer_name || "" });
        }
      });
      setCustomers(unique);
    })();
  }, []);

  const handleBulkSend = async () => {
    if (customers.length === 0) {
      toast({ title: "ত্রুটি", description: "কোনো কাস্টমার নেই", variant: "destructive" });
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিত? ${customers.length} জন কাস্টমারকে ইমেইল পাঠানো হবে।`)) return;

    setSending(true);
    setProgress({ sent: 0, failed: 0, total: customers.length });

    const { data: { user } } = await supabase.auth.getUser();
    // Send in batches of 20 to keep edge function happy
    const BATCH = 20;
    let sentTotal = 0;
    let failedTotal = 0;

    for (let i = 0; i < customers.length; i += BATCH) {
      const batch = customers.slice(i, i + BATCH);
      const recipients = batch.map((c) => ({
        email: c.email,
        name: c.name,
        variables: { customer_name: c.name || "গ্রাহক" },
      }));
      const variables: Record<string, string> = {};
      if (templateKey === "custom_admin") {
        variables.custom_subject = customSubject || "আপনার জন্য একটি বার্তা";
        variables.custom_message = customMessage.replace(/\n/g, "<br/>");
      }
      const result = await sendEmail({
        templateKey,
        recipients,
        variables,
        sentBy: user?.id || null,
      });
      sentTotal += result.sent;
      failedTotal += result.failed;
      setProgress({ sent: sentTotal, failed: failedTotal, total: customers.length });
    }

    setSending(false);
    toast({
      title: "🎯 Bulk send সম্পন্ন",
      description: `সফল: ${sentTotal} | ব্যর্থ: ${failedTotal}`,
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">📢 সকল কাস্টমারকে ইমেইল</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">unique কাস্টমার</p>
            </div>
          </div>
        </div>

        <div>
          <Label>টেমপ্লেট</Label>
          <Select value={templateKey} onValueChange={setTemplateKey}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.template_key}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {templateKey === "custom_admin" && (
          <>
            <div>
              <Label>বিষয়</Label>
              <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} className="mt-2" placeholder="বিশেষ অফার, ঘোষণা..." />
            </div>
            <div>
              <Label>বার্তা</Label>
              <Textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={8} className="mt-2" placeholder="আপনার বার্তা..." />
            </div>
          </>
        )}

        {sending && (
          <div className="bg-muted/40 p-3 rounded-lg text-sm">
            <div className="flex items-center justify-between mb-2">
              <span>প্রগ্রেস:</span>
              <span className="font-mono">{progress.sent + progress.failed} / {progress.total}</span>
            </div>
            <div className="h-2 bg-background rounded overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }} />
            </div>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-green-600">✓ {progress.sent}</span>
              <span className="text-destructive">✗ {progress.failed}</span>
            </div>
          </div>
        )}

        <Button onClick={handleBulkSend} disabled={sending || customers.length === 0} className="w-full gap-2" size="lg">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {sending ? "পাঠানো হচ্ছে..." : `${customers.length} জনকে পাঠান`}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------------- Templates Tab ---------------- */
const TemplatesTab = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [previewing, setPreviewing] = useState<Template | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("email_templates").select("*").order("name");
    setTemplates(data || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const handleSave = async (tpl: Template) => {
    const { error } = await supabase
      .from("email_templates")
      .update({
        name: tpl.name,
        description: tpl.description,
        subject: tpl.subject,
        html_body: tpl.html_body,
        is_active: tpl.is_active,
      })
      .eq("id", tpl.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ সংরক্ষিত হয়েছে" });
      setEditing(null);
      void load();
    }
  };

  const handleToggle = async (tpl: Template, active: boolean) => {
    const { error } = await supabase.from("email_templates").update({ is_active: active }).eq("id", tpl.id);
    if (!error) {
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? { ...t, is_active: active } : t)));
    }
  };

  if (loading) return <AdminPageState type="loading" />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id} className="rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base flex items-center gap-2">
                  {t.name}
                  {t.is_system && <Badge variant="outline" className="text-[10px] h-5">SYSTEM</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 truncate">{t.description}</p>
                <code className="text-[11px] text-primary mt-1 block truncate">{t.template_key}</code>
              </div>
              <Switch checked={t.is_active} onCheckedChange={(v) => handleToggle(t, v)} />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-xs text-muted-foreground">বিষয়:</div>
            <div className="text-sm font-medium bg-muted/30 p-2 rounded truncate">{t.subject}</div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setPreviewing(t)}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
              <Button size="sm" className="flex-1 gap-1" onClick={() => setEditing({ ...t })}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>টেমপ্লেট সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>নাম</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>বিষয় (Subject)</Label>
                <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="mt-1" />
                {TEMPLATE_VARIABLE_HINTS[editing.template_key] && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables: {TEMPLATE_VARIABLE_HINTS[editing.template_key].map((v) => `{{${v}}}`).join(", ")}
                  </p>
                )}
              </div>
              <div>
                <Label>HTML Body</Label>
                <Textarea
                  value={editing.html_body}
                  onChange={(e) => setEditing({ ...editing, html_body: e.target.value })}
                  rows={16}
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setPreviewing(editing)}>
                  <Eye className="h-4 w-4 mr-1" /> Live Preview
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
                  <Button onClick={() => handleSave(editing)}>সংরক্ষণ</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>প্রিভিউ — {previewing?.name}</DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className="space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Subject:</div>
                <div className="font-medium">{previewing.subject}</div>
              </div>
              <iframe
                title="preview"
                srcDoc={previewing.html_body
                  .replace(/\{\{customer_name\}\}/g, "মোঃ রহিম")
                  .replace(/\{\{order_code\}\}/g, "SM-0042")
                  .replace(/\{\{order_total\}\}/g, "২,৫০০")
                  .replace(/\{\{order_subtotal\}\}/g, "২,৩০০")
                  .replace(/\{\{order_shipping\}\}/g, "২০০")
                  .replace(/\{\{order_status\}\}/g, "শিপড")
                  .replace(/\{\{status_message\}\}/g, "আপনার অর্ডারটি কুরিয়ারে পাঠানো হয়েছে।")
                  .replace(/\{\{shipping_address\}\}/g, "১২৩ মেইন রোড, ঢাকা")
                  .replace(/\{\{site_name\}\}/g, "Sapahar Mango")
                  .replace(/\{\{company_email\}\}/g, "info@sapaharmango.com")
                  .replace(/\{\{custom_subject\}\}/g, "বিশেষ অফার")
                  .replace(/\{\{custom_message\}\}/g, "এটি একটি sample বার্তা।")
                  .replace(/\{\{items_html\}\}/g, "<p style='padding:8px;background:#f0fdfa;border-radius:6px;'>স্যাম্পল পণ্য × ২ — ৳ ২,০০০</p>")}
                className="w-full min-h-[500px] border rounded-lg bg-white"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------------- Logs Tab ---------------- */
const LogsTab = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_logs")
      .select("id, recipient_email, recipient_name, subject, template_key, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setLogs(data || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.recipient_email.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q) ||
          (l.recipient_name || "").toLowerCase().includes(q) ||
          (l.template_key || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, statusFilter]);

  const stats = useMemo(() => {
    const sent = logs.filter((l) => l.status === "sent").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    return { total: logs.length, sent, failed };
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-xl"><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">মোট</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent></Card>
        <Card className="rounded-xl bg-green-50 dark:bg-green-950/20"><CardContent className="p-4">
          <div className="text-xs text-green-700 dark:text-green-400">সফল</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.sent}</div>
        </CardContent></Card>
        <Card className="rounded-xl bg-red-50 dark:bg-red-950/20"><CardContent className="p-4">
          <div className="text-xs text-destructive">ব্যর্থ</div>
          <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
        </CardContent></Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ইমেইল, বিষয় বা টেমপ্লেট দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="sent">সফল</SelectItem>
                <SelectItem value="failed">ব্যর্থ</SelectItem>
                <SelectItem value="pending">পেন্ডিং</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <AdminPageState type="loading" />
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">কোনো লগ পাওয়া যায়নি</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((l) => (
                <div key={l.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{l.subject}</span>
                        {l.status === "sent" ? (
                          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 text-[10px] h-5">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
                          </Badge>
                        ) : l.status === "failed" ? (
                          <Badge className="bg-destructive/15 text-destructive border-0 text-[10px] h-5">
                            <XCircle className="h-3 w-3 mr-1" /> Failed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5">{l.status}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        → {l.recipient_name ? `${l.recipient_name} <${l.recipient_email}>` : l.recipient_email}
                      </div>
                      {l.template_key && (
                        <code className="text-[10px] text-primary">{l.template_key}</code>
                      )}
                      {l.error_message && (
                        <div className="text-xs text-destructive mt-1 bg-destructive/5 p-1.5 rounded">
                          {l.error_message}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("bn-BD")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmails;
