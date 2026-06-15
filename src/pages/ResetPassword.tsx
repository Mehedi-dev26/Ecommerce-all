import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

type Status = "verifying" | "ready" | "invalid";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, logoUrl } = useSiteSettings();
  const brandName = settings.brand_name || "Sapahar Shop";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Establish a recovery session from either flow:
  //   - PKCE:     ?code=<code>            → exchangeCodeForSession
  //   - Implicit: #access_token=...&type=recovery → setSession from hash
  useEffect(() => {
    let cancelled = false;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hash = window.location.hash || "";
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    const type = hashParams.get("type");
    const error_description =
      url.searchParams.get("error_description") || hashParams.get("error_description");

    const cleanUrl = () => {
      // Strip tokens from the address bar for safety
      window.history.replaceState({}, "", "/reset-password");
    };

    const init = async () => {
      if (error_description) {
        if (!cancelled) {
          setErrorMsg(decodeURIComponent(error_description));
          setStatus("invalid");
        }
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          cleanUrl();
          if (!cancelled) setStatus("ready");
          return;
        }

        if (access_token && refresh_token && type === "recovery") {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          cleanUrl();
          if (!cancelled) setStatus("ready");
          return;
        }

        // Already authenticated via PASSWORD_RECOVERY event from a previous load
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) setStatus("ready");
          return;
        }

        if (!cancelled) {
          setErrorMsg("রিকভারি লিঙ্কটি অবৈধ বা মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
          setStatus("invalid");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "রিকভারি লিঙ্ক যাচাই করা যায়নি।");
          setStatus("invalid");
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "ত্রুটি", description: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "ত্রুটি", description: "পাসওয়ার্ড মিলছে না", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Decide where to land: admin → /admin, otherwise → /dashboard
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      let target = "/dashboard";
      if (uid) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) target = "/admin";
      }
      setTimeout(() => navigate(target, { replace: true }), 1800);
    } catch {
      setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
    }
  };

  if (success) {
    return (
      <>
        <SEO title="পাসওয়ার্ড রিসেট" description={`${brandName} পাসওয়ার্ড পুনরায় সেট করুন।`} path="/reset-password" noindex />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">পাসওয়ার্ড পরিবর্তন হয়েছে!</h2>
            <p className="text-sm text-muted-foreground">রিডাইরেক্ট হচ্ছে...</p>
          </div>
        </div>
      </>
    );
  }

  if (status === "verifying") {
    return (
      <>
        <SEO title="পাসওয়ার্ড রিসেট" description={`${brandName} পাসওয়ার্ড পুনরায় সেট করুন।`} path="/reset-password" noindex />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">রিকভারি লিঙ্ক যাচাই হচ্ছে...</p>
          </div>
        </div>
      </>
    );
  }

  if (status === "invalid") {
    return (
      <>
        <SEO title="পাসওয়ার্ড রিসেট" description={`${brandName} পাসওয়ার্ড পুনরায় সেট করুন।`} path="/reset-password" noindex />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">লিঙ্কটি কাজ করছে না</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/login")} className="w-full">নতুন রিসেট লিঙ্ক চান</Button>
              <Button variant="outline" onClick={() => navigate("/admin/login")} className="w-full">অ্যাডমিন লগইন</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="পাসওয়ার্ড রিসেট" description={`${brandName} পাসওয়ার্ড পুনরায় সেট করুন।`} path="/reset-password" noindex />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 ring-4 ring-primary/20 mb-3 overflow-hidden">
              <img src={logoUrl} alt={brandName} className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">নতুন পাসওয়ার্ড সেট করুন</h1>
            <p className="text-sm text-muted-foreground mt-1">আপনার নতুন পাসওয়ার্ড দিন</p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">নতুন পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="আবার পাসওয়ার্ড দিন"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-medium">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "পাসওয়ার্ড পরিবর্তন করুন"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
