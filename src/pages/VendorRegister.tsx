import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { divisions } from "@/data/bd-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Store, Upload, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";

const schema = z.object({
  shop_name: z.string().trim().min(2, "ইংরেজি নাম দিন").max(80),
  shop_name_bn: z.string().trim().min(2, "বাংলা নাম দিন").max(80),
  description: z.string().trim().max(500).optional(),
  owner_name: z.string().trim().min(2, "মালিকের নাম দিন").max(80),
  nid_number: z.string().trim().regex(/^\d{10,17}$/, "NID নাম্বার ১০-১৭ ডিজিট হতে হবে"),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, "সঠিক মোবাইল নাম্বার দিন (01XXXXXXXXX)"),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(120),
  facebook_url: z.string().trim().url("সঠিক URL দিন").max(200).optional().or(z.literal("")),
  division: z.string().min(1, "বিভাগ সিলেক্ট করুন"),
  district: z.string().min(1, "জেলা সিলেক্ট করুন"),
  upazila: z.string().min(1, "উপজেলা সিলেক্ট করুন"),
  address: z.string().trim().min(5, "সম্পূর্ণ ঠিকানা দিন").max(300),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "shop";

const VendorRegister = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    shop_name: "",
    shop_name_bn: "",
    description: "",
    owner_name: "",
    nid_number: "",
    phone: "",
    email: "",
    facebook_url: "",
    division: "",
    district: "",
    upazila: "",
    address: "",
  });

  // Pre-fill from auth
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: f.email || user.email || "",
        owner_name: f.owner_name || (user.user_metadata?.full_name as string) || "",
      }));
      // Check if user already has a vendor record
      (async () => {
        const { data } = await supabase
          .from("vendors" as any)
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setExistingStatus((data as any).status);
      })();
    }
  }, [user]);

  const districts = useMemo(
    () => divisions.find((d) => d.name === form.division)?.districts || [],
    [form.division]
  );
  const upazilas = useMemo(
    () => districts.find((d) => d.name === form.district)?.upazilas || [],
    [districts, form.district]
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "ছবি বড়!", description: "২MB এর কম ছবি দিন", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "প্রথমে লগইন করুন", description: "রেজিস্ট্রেশনের জন্য লগইন প্রয়োজন" });
      navigate("/login?redirect=/vendor/register");
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "ফর্মে ত্রুটি", description: first.message, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload logo if any
      let logo_url: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "jpg";
        const path = `vendor-logos/${user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        logo_url = pub.publicUrl;
      }

      // Slug uniqueness — append short suffix if needed
      const baseSlug = slugify(parsed.data.shop_name_bn || parsed.data.shop_name);
      const shop_slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const { error } = await supabase.from("vendors" as any).insert({
        user_id: user.id,
        shop_name: parsed.data.shop_name,
        shop_name_bn: parsed.data.shop_name_bn,
        shop_slug,
        logo_url,
        description: parsed.data.description || null,
        owner_name: parsed.data.owner_name,
        nid_number: parsed.data.nid_number,
        phone: parsed.data.phone,
        email: parsed.data.email,
        facebook_url: parsed.data.facebook_url || null,
        division: parsed.data.division,
        district: parsed.data.district,
        upazila: parsed.data.upazila,
        address: parsed.data.address,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          throw new Error("এই NID দিয়ে ইতিমধ্যে রেজিস্ট্রেশন আছে");
        }
        throw error;
      }

      setSubmitted(true);
      toast({ title: "আবেদন সফল!", description: "অ্যাডমিন রিভিউ করার পর জানানো হবে" });
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message || "আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="container mx-auto py-20 text-center">লোড হচ্ছে...</div>;

  // Already submitted state
  if (submitted || (existingStatus && existingStatus !== "rejected")) {
    const status = existingStatus || "pending";
    const statusText: Record<string, { title: string; desc: string; color: string }> = {
      pending: { title: "আবেদন পর্যালোচনাধীন", desc: "আপনার আবেদন সফলভাবে জমা হয়েছে। অ্যাডমিন অনুমোদন করলে ইমেইলে জানানো হবে।", color: "text-amber-600" },
      approved: { title: "অভিনন্দন! আপনি অনুমোদিত বিক্রেতা", desc: "আপনি এখন আপনার নিজের শপ পরিচালনা শুরু করতে পারবেন।", color: "text-green-600" },
      suspended: { title: "আপনার দোকান সাময়িকভাবে স্থগিত", desc: "অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।", color: "text-red-600" },
    };
    const info = statusText[status] || statusText.pending;
    return (
      <div className="container mx-auto max-w-2xl py-16 px-4">
        <Card className="text-center border-2">
          <CardContent className="pt-12 pb-10">
            <CheckCircle2 className={`h-20 w-20 mx-auto mb-4 ${info.color}`} />
            <h2 className="text-2xl font-bold mb-2">{info.title}</h2>
            <p className="text-muted-foreground mb-6">{info.desc}</p>
            <Button onClick={() => navigate("/")}>হোমে ফিরে যান</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="বিক্রেতা নিবন্ধন | Sapahar Shop" description="আপনার দোকান নিবন্ধন করুন এবং সারা বাংলাদেশে আম, লিচু, ফল বিক্রি শুরু করুন।" />
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 min-h-screen py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="font-brand text-4xl md:text-5xl text-primary mb-2">বিক্রেতা হোন</h1>
            <p className="text-muted-foreground">আপনার দোকান নিবন্ধন করুন এবং আমাদের প্ল্যাটফর্মে আপনার পণ্য বিক্রি শুরু করুন</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle>দোকানের তথ্য</CardTitle>
              <CardDescription>সব তথ্য সঠিকভাবে পূরণ করুন। অ্যাডমিন রিভিউ করার পর আপনার দোকান চালু হবে।</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Logo */}
                <div>
                  <Label>দোকানের লোগো (ঐচ্ছিক)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <Input type="file" accept="image/*" onChange={handleLogoChange} className="max-w-xs" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>দোকানের নাম (বাংলা) *</Label>
                    <Input value={form.shop_name_bn} onChange={(e) => setForm({ ...form, shop_name_bn: e.target.value })} placeholder="যেমনঃ আম বাজার" />
                  </div>
                  <div>
                    <Label>Shop Name (English) *</Label>
                    <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="e.g. Aam Bazar" />
                  </div>
                </div>

                <div>
                  <Label>দোকান সম্পর্কে (ঐচ্ছিক)</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="আপনার দোকান ও পণ্য সম্পর্কে সংক্ষেপে লিখুন" rows={3} />
                </div>

                <div className="border-t pt-5">
                  <h3 className="font-bold mb-3 text-primary">মালিকের তথ্য</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>মালিকের পূর্ণ নাম *</Label>
                      <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>NID নাম্বার *</Label>
                      <Input value={form.nid_number} onChange={(e) => setForm({ ...form, nid_number: e.target.value.replace(/\D/g, "") })} placeholder="১০-১৭ ডিজিট" inputMode="numeric" />
                    </div>
                    <div>
                      <Label>মোবাইল নাম্বার *</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" />
                    </div>
                    <div>
                      <Label>ইমেইল *</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Facebook Page (ঐচ্ছিক)</Label>
                      <Input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <h3 className="font-bold mb-3 text-primary">ঠিকানা</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>বিভাগ *</Label>
                      <Select value={form.division} onValueChange={(v) => setForm({ ...form, division: v, district: "", upazila: "" })}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>
                          {divisions.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>জেলা *</Label>
                      <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v, upazila: "" })} disabled={!form.division}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => <SelectItem key={d.name} value={d.name}>{d.name_bn}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>উপজেলা *</Label>
                      <Select value={form.upazila} onValueChange={(v) => setForm({ ...form, upazila: v })} disabled={!form.district}>
                        <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                        <SelectContent>
                          {upazilas.map((u) => <SelectItem key={u.name} value={u.name}>{u.name_bn}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>সম্পূর্ণ ঠিকানা *</Label>
                    <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাড়ি/হোল্ডিং, রোড, এলাকা" rows={2} />
                  </div>
                </div>

                <div className="border-t pt-5">
                  <Button type="submit" disabled={submitting} size="lg" className="w-full text-base">
                    {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> জমা হচ্ছে...</> : "আবেদন জমা দিন"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    আবেদন জমা দিলে অ্যাডমিন রিভিউ করবে এবং অনুমোদনের পর আপনি ড্যাশবোর্ড অ্যাক্সেস পাবেন।
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default VendorRegister;
