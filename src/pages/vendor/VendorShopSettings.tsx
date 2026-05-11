import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendor } from "@/hooks/useVendor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Upload } from "lucide-react";

const VendorShopSettings = () => {
  const { vendor, refresh } = useVendor();
  const qc = useQueryClient();
  const [shopForm, setShopForm] = useState({
    shop_name: "", shop_name_bn: "", description: "", facebook_url: "", phone: "", email: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [savingShop, setSavingShop] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    preferred_method: "bkash",
    bkash_number: "", nagad_number: "", rocket_number: "",
    bank_name: "", bank_branch: "", account_holder: "", account_number: "", routing_number: "",
    notes: "",
  });
  const [savingPayout, setSavingPayout] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["vendor-settings", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("vendor_settings" as any).select("*").eq("vendor_id", vendor!.id).maybeSingle();
      return data as any;
    },
  });

  useEffect(() => {
    if (vendor) {
      setShopForm({
        shop_name: vendor.shop_name,
        shop_name_bn: vendor.shop_name_bn,
        description: vendor.description || "",
        facebook_url: vendor.facebook_url || "",
        phone: vendor.phone,
        email: vendor.email,
      });
    }
  }, [vendor]);

  useEffect(() => {
    if (settings) {
      setPayoutForm({
        preferred_method: settings.preferred_method || "bkash",
        bkash_number: settings.bkash_number || "",
        nagad_number: settings.nagad_number || "",
        rocket_number: settings.rocket_number || "",
        bank_name: settings.bank_name || "",
        bank_branch: settings.bank_branch || "",
        account_holder: settings.account_holder || "",
        account_number: settings.account_number || "",
        routing_number: settings.routing_number || "",
        notes: settings.notes || "",
      });
    }
  }, [settings]);

  const uploadFile = async (file: File, kind: "logo" | "banner") => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `vendor-${kind}s/${vendor!.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const handleSaveShop = async () => {
    if (!vendor) return;
    setSavingShop(true);
    try {
      const update: any = { ...shopForm };
      if (logoFile) update.logo_url = await uploadFile(logoFile, "logo");
      if (bannerFile) update.banner_url = await uploadFile(bannerFile, "banner");
      const { error } = await supabase.from("vendors" as any).update(update).eq("id", vendor.id);
      if (error) throw error;
      toast({ title: "✅ সংরক্ষিত হয়েছে" });
      setLogoFile(null); setBannerFile(null);
      await refresh();
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setSavingShop(false);
    }
  };

  const handleSavePayout = async () => {
    if (!vendor) return;
    setSavingPayout(true);
    try {
      const payload = { vendor_id: vendor.id, ...payoutForm };
      if (settings) {
        const { error } = await supabase.from("vendor_settings" as any).update(payload).eq("vendor_id", vendor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendor_settings" as any).insert(payload);
        if (error) throw error;
      }
      toast({ title: "✅ সংরক্ষিত হয়েছে" });
      qc.invalidateQueries({ queryKey: ["vendor-settings"] });
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setSavingPayout(false);
    }
  };

  if (!vendor) return <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">শপ সেটিংস</h1>
        <p className="text-muted-foreground text-sm mt-1">দোকানের তথ্য ও পেমেন্ট তথ্য আপডেট করুন</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-lg">দোকানের তথ্য</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>লোগো</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-16 w-16 rounded-lg border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center">
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="" className="h-full w-full object-cover" />
                  ) : vendor.logo_url ? (
                    <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div>
              <Label>ব্যানার</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-16 w-24 rounded-lg border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center">
                  {bannerFile ? (
                    <img src={URL.createObjectURL(bannerFile)} alt="" className="h-full w-full object-cover" />
                  ) : vendor.banner_url ? (
                    <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div>
              <Label>দোকানের নাম (বাংলা)</Label>
              <Input value={shopForm.shop_name_bn} onChange={(e) => setShopForm({ ...shopForm, shop_name_bn: e.target.value })} />
            </div>
            <div>
              <Label>Shop Name (English)</Label>
              <Input value={shopForm.shop_name} onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })} />
            </div>
            <div>
              <Label>মোবাইল</Label>
              <Input value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>ইমেইল</Label>
              <Input value={shopForm.email} onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Facebook</Label>
              <Input value={shopForm.facebook_url} onChange={(e) => setShopForm({ ...shopForm, facebook_url: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>বিবরণ</Label>
              <Textarea value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} rows={3} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            কমিশন: <span className="font-semibold text-foreground">{vendor.commission_percent}%</span> (অ্যাডমিন কর্তৃক নির্ধারিত)
          </div>

          <Button onClick={handleSaveShop} disabled={savingShop}>
            {savingShop ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-lg">পেমেন্ট তথ্য</h2>
          <p className="text-xs text-muted-foreground">টাকা উত্তোলনের জন্য আপনার পছন্দের পদ্ধতি ও তথ্য</p>

          <div>
            <Label>পছন্দের পদ্ধতি</Label>
            <Select value={payoutForm.preferred_method} onValueChange={(v) => setPayoutForm({ ...payoutForm, preferred_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="rocket">Rocket</SelectItem>
                <SelectItem value="bank">ব্যাংক</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>bKash</Label>
              <Input value={payoutForm.bkash_number} onChange={(e) => setPayoutForm({ ...payoutForm, bkash_number: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <Label>Nagad</Label>
              <Input value={payoutForm.nagad_number} onChange={(e) => setPayoutForm({ ...payoutForm, nagad_number: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <Label>Rocket</Label>
              <Input value={payoutForm.rocket_number} onChange={(e) => setPayoutForm({ ...payoutForm, rocket_number: e.target.value })} placeholder="01XXXXXXXXX-X" />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">ব্যাংক তথ্য (ঐচ্ছিক)</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>ব্যাংকের নাম</Label>
                <Input value={payoutForm.bank_name} onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })} />
              </div>
              <div>
                <Label>শাখা</Label>
                <Input value={payoutForm.bank_branch} onChange={(e) => setPayoutForm({ ...payoutForm, bank_branch: e.target.value })} />
              </div>
              <div>
                <Label>অ্যাকাউন্ট হোল্ডার</Label>
                <Input value={payoutForm.account_holder} onChange={(e) => setPayoutForm({ ...payoutForm, account_holder: e.target.value })} />
              </div>
              <div>
                <Label>অ্যাকাউন্ট নাম্বার</Label>
                <Input value={payoutForm.account_number} onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>রাউটিং নাম্বার</Label>
                <Input value={payoutForm.routing_number} onChange={(e) => setPayoutForm({ ...payoutForm, routing_number: e.target.value })} />
              </div>
            </div>
          </div>

          <Button onClick={handleSavePayout} disabled={savingPayout}>
            {savingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            পেমেন্ট তথ্য সংরক্ষণ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorShopSettings;
