import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminPageState from "@/components/admin/AdminPageState";
import { getErrorMessage } from "@/lib/error-message";
import { Save, Phone, Mail, MapPin, Facebook, FileText, Instagram, Youtube } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  footer_phone: <Phone className="h-4 w-4 text-primary" />,
  footer_email: <Mail className="h-4 w-4 text-primary" />,
  footer_location: <MapPin className="h-4 w-4 text-primary" />,
  footer_facebook: <Facebook className="h-4 w-4 text-primary" />,
  footer_instagram: <Instagram className="h-4 w-4 text-primary" />,
  footer_youtube: <Youtube className="h-4 w-4 text-primary" />,
  footer_copyright: <FileText className="h-4 w-4 text-primary" />,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("created_at");
      if (error) throw error;
      const items = (data || []) as Setting[];
      setSettings(items);
      const values: Record<string, string> = {};
      items.forEach((s) => { values[s.key] = s.value; });
      setFormValues(values);
    } catch (err) {
      setError(getErrorMessage(err, "সেটিংস লোড করা যায়নি"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = settings.map((s) =>
        supabase
          .from("site_settings")
          .update({ value: formValues[s.key] ?? s.value })
          .eq("id", s.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      toast({ title: "সেটিংস আপডেট হয়েছে ✓" });
    } catch (err) {
      toast({ title: "ত্রুটি", description: getErrorMessage(err, "সেভ করা যায়নি"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminPageState loading message="সেটিংস লোড হচ্ছে..." />;
  if (error) return <AdminPageState title="সেটিংস লোড করা যায়নি" message={error} onRetry={fetchSettings} />;

  const footerSettings = settings.filter((s) => s.key.startsWith("footer_"));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-foreground">সাইট সেটিংস</h2>
        <p className="text-sm text-muted-foreground">ফুটার ও যোগাযোগ তথ্য এখান থেকে আপডেট করুন</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            ফুটার যোগাযোগ তথ্য
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {footerSettings.map((s) => (
            <div key={s.id} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                {iconMap[s.key]}
                {s.label || s.key}
              </Label>
              <Input
                value={formValues[s.key] ?? ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
                placeholder={s.label || s.key}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg shadow-primary/20">
        <Save className="h-4 w-4" />
        {saving ? "সেভ হচ্ছে..." : "সেটিংস সেভ করুন"}
      </Button>
    </div>
  );
};

export default AdminSettings;
