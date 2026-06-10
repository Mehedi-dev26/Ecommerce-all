import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Truck, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ExternalLink, Save, Zap, ListOrdered } from "lucide-react";
import CourierShipmentsLog from "@/components/admin/CourierShipmentsLog";

type Provider = {
  id: string;
  provider_key: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  credentials: Record<string, string | number>;
  sort_order: number;
};

const PROVIDER_META: Record<string, {
  fields: { key: string; label: string; type?: string; placeholder?: string; help?: string }[];
  docsUrl: string;
  signupUrl: string;
  description: string;
  functionName: "pathao" | "steadfast";
}> = {
  pathao: {
    description: "বাংলাদেশের সবচেয়ে জনপ্রিয় ই-কমার্স কুরিয়ার সার্ভিস। দ্রুত হোম ডেলিভারি ও COD সাপোর্ট।",
    docsUrl: "https://merchant.pathao.com/courier/developer-api",
    signupUrl: "https://merchant.pathao.com",
    functionName: "pathao",
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "Pathao Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password" },
      { key: "username", label: "Merchant Email", placeholder: "you@example.com" },
      { key: "password", label: "Merchant Password", type: "password" },
      { key: "base_url", label: "Base URL", placeholder: "https://api-hermes.pathao.com", help: "প্রোডাকশন: api-hermes.pathao.com, স্যান্ডবক্স: courier-api-sandbox.pathao.com" },
      { key: "store_id", label: "Default Store ID", type: "number", help: "ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে নেওয়া হবে" },
    ],
  },
  steadfast: {
    description: "দ্রুত ও নির্ভরযোগ্য কুরিয়ার সার্ভিস। সারা বাংলাদেশে হোম ডেলিভারি।",
    docsUrl: "https://docs.google.com/document/d/14JNs6IeDpFTU94Y1DxB9TffFvTaqu_pPstfKkyimkqA",
    signupUrl: "https://steadfast.com.bd",
    functionName: "steadfast",
    fields: [
      { key: "api_key", label: "Api-Key", type: "password" },
      { key: "secret_key", label: "Secret-Key", type: "password" },
      { key: "base_url", label: "Base URL", placeholder: "https://portal.packzy.com/api/v1" },
    ],
  },
};

const AdminCourierApi = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pathao");
  const { toast } = useToast();

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("courier_providers")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      setProviders((data as Provider[]) || []);
    } catch (e) {
      setError(getErrorMessage(e, "কুরিয়ার লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchProviders(); }, []);

  if (loading) return <AdminPageState loading message="কুরিয়ার সেটিংস লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="লোড করা যায়নি" message={error} onRetry={fetchProviders} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            কুরিয়ার API
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            পাঠাও, Steadfast সহ যেকোনো কুরিয়ার সার্ভিসের API credentials এখান থেকে কনফিগার করুন
          </p>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((p) => {
          const meta = PROVIDER_META[p.provider_key];
          const configured = meta?.fields.filter(f => f.key !== "base_url" && f.key !== "store_id")
            .every(f => p.credentials?.[f.key]);
          return (
            <Card key={p.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${configured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.display_name}</p>
                      {p.is_default && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">ডিফল্ট</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {configured ? (
                        <><CheckCircle2 className="h-3 w-3 text-primary" /> কনফিগার করা</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 text-destructive" /> কনফিগার করা হয়নি</>
                      )}
                      {!p.is_active && <span className="text-destructive ml-2">(নিষ্ক্রিয়)</span>}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab(p.provider_key)}>
                  সম্পাদনা
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          {providers.map((p) => (
            <TabsTrigger key={p.id} value={p.provider_key} className="data-[state=active]:bg-background">
              {p.display_name}
            </TabsTrigger>
          ))}
        </TabsList>

        {providers.map((p) => (
          <TabsContent key={p.id} value={p.provider_key} className="mt-4">
            <ProviderForm provider={p} onSaved={fetchProviders} toast={toast} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const ProviderForm = ({ provider, onSaved, toast }: { provider: Provider; onSaved: () => void; toast: ReturnType<typeof useToast>["toast"] }) => {
  const meta = PROVIDER_META[provider.provider_key];
  const [creds, setCreds] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    meta?.fields.forEach(f => {
      const v = provider.credentials?.[f.key];
      out[f.key] = v == null ? "" : String(v);
    });
    return out;
  });
  const [isActive, setIsActive] = useState(provider.is_active);
  const [isDefault, setIsDefault] = useState(provider.is_default);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  if (!meta) return <p className="text-sm text-muted-foreground">এই প্রোভাইডারের কনফিগ পাওয়া যায়নি</p>;

  const save = async () => {
    setSaving(true);
    try {
      const cleanCreds: Record<string, string | number> = {};
      for (const f of meta.fields) {
        const val = creds[f.key]?.trim();
        if (val) cleanCreds[f.key] = f.type === "number" ? Number(val) : val;
      }

      // If setting this as default, unset others first
      if (isDefault && !provider.is_default) {
        await supabase.from("courier_providers").update({ is_default: false }).neq("id", provider.id);
      }

      const { error } = await supabase
        .from("courier_providers")
        .update({
          credentials: cleanCreds,
          is_active: isActive,
          is_default: isDefault,
        })
        .eq("id", provider.id);
      if (error) throw error;
      toast({ title: "সংরক্ষিত হয়েছে", description: `${provider.display_name} আপডেট হয়েছে` });
      onSaved();
    } catch (e) {
      toast({ title: "ত্রুটি", description: getErrorMessage(e, "সেভ করা যায়নি"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke(`${meta.functionName}?action=verify-credentials`, { method: "GET" });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast({ title: "✅ কানেকশন সফল", description: `${provider.display_name} এর সাথে যোগাযোগ ঠিক আছে` });
    } catch (e) {
      toast({ title: "❌ কানেকশন ব্যর্থ", description: getErrorMessage(e, "API call failed"), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-border/50 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {provider.display_name} সেটআপ
            </CardTitle>
            <CardDescription className="mt-1">{meta.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Docs
            </a>
            <a href={meta.signupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Merchant Panel
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meta.fields.map(f => {
            const isPwd = f.type === "password";
            const visible = showSecret[f.key];
            return (
              <div key={f.key} className={f.key === "base_url" ? "md:col-span-2" : ""}>
                <Label className="text-xs font-medium mb-1.5 block">{f.label}</Label>
                <div className="relative">
                  <Input
                    type={isPwd && !visible ? "password" : f.type === "number" ? "number" : "text"}
                    value={creds[f.key] || ""}
                    onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ""}
                    className={isPwd ? "pr-10" : ""}
                    autoComplete="off"
                  />
                  {isPwd && (
                    <button
                      type="button"
                      onClick={() => setShowSecret({ ...showSecret, [f.key]: !visible })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {f.help && <p className="text-[11px] text-muted-foreground mt-1">{f.help}</p>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">সক্রিয়</p>
              <p className="text-xs text-muted-foreground">এই কুরিয়ার অর্ডার পাঠানোর সময় দেখানো হবে</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">ডিফল্ট কুরিয়ার</p>
              <p className="text-xs text-muted-foreground">নতুন অর্ডারের জন্য আগে থেকে সিলেক্ট থাকবে</p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            সংরক্ষণ করুন
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            কানেকশন টেস্ট করুন
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCourierApi;