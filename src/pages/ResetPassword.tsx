import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import brandLogo from "@/assets/brand-logo.png";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if we have a recovery session
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also listen for auth state change for recovery
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      // Give it a moment
      setTimeout(() => setReady(true), 1000);
      return () => subscription.unsubscribe();
    }
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
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <>
      <SEO title="পাসওয়ার্ড রিসেট" description="Sapahar Mango Shop পাসওয়ার্ড পুনরায় সেট করুন।" path="/reset-password" noindex />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">পাসওয়ার্ড পরিবর্তন হয়েছে!</h2>
          <p className="text-sm text-muted-foreground">ড্যাশবোর্ডে রিডাইরেক্ট হচ্ছে...</p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <SEO title="পাসওয়ার্ড রিসেট" description="Sapahar Mango Shop পাসওয়ার্ড পুনরায় সেট করুন।" path="/reset-password" noindex />
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 ring-4 ring-primary/20 mb-3 overflow-hidden">
            <img src={brandLogo} alt="Sapahar Mango Shop" className="h-12 w-12 object-contain" />
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
