import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { hasAdminRole } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/error-message";
import SEO from "@/components/SEO";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const AdminLogin = () => {
  const { settings, logoUrl } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Shop";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const isAdmin = await hasAdminRole(data.user.id);

      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({ title: "অ্যাক্সেস নেই", description: "আপনার অ্যাডমিন অ্যাক্সেস নেই।", variant: "destructive" });
        return;
      }

      toast({ title: "সফল!", description: "অ্যাডমিন প্যানেলে স্বাগতম।" });
      navigate("/admin", { replace: true });
    } catch (error) {
      toast({ title: "লগইন ব্যর্থ", description: getErrorMessage(error, "লগইন করা যায়নি।"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "ইমেইল দিন", description: "প্রথমে আপনার অ্যাডমিন ইমেইল লিখুন।", variant: "destructive" });
      return;
    }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "পাঠানো যায়নি", description: getErrorMessage(error, "রিসেট লিঙ্ক পাঠানো যায়নি।"), variant: "destructive" });
    } else {
      toast({ title: "ইমেইল পাঠানো হয়েছে", description: `${email}-এ পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে।` });
    }
  };

  return (
    <>
    <SEO title="অ্যাডমিন লগইন" description={`${brandName} অ্যাডমিন প্যানেল লগইন।`} path="/admin/login" noindex />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-white ring-4 ring-primary/20 flex items-center justify-center shadow-md overflow-hidden">
              <img src={logoUrl} alt={`${brandName} logo`} className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            <span className="font-brand text-primary text-4xl">{brandName}</span>
            <br />
            <span className="text-lg text-muted-foreground">অ্যাডমিন প্যানেল</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </Button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={sendingReset}
              className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50"
            >
              {sendingReset ? "পাঠানো হচ্ছে..." : "পাসওয়ার্ড ভুলে গেছেন?"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AdminLogin;
