import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Truck, Headphones, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.png";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register" | "forgot";

const Login = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [signingIn, setSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const from = (location.state as any)?.from || "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, navigate, from]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setSigningIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) return;

    setSigningIn(true);
    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(form.email);
        if (error) {
          toast({ title: "ত্রুটি", description: error, variant: "destructive" });
        } else {
          toast({ title: "✅ ইমেইল পাঠানো হয়েছে", description: "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।" });
          setMode("login");
        }
      } else if (mode === "register") {
        if (!form.name.trim()) {
          toast({ title: "ত্রুটি", description: "আপনার নাম দিন", variant: "destructive" });
          return;
        }
        if (form.password.length < 6) {
          toast({ title: "ত্রুটি", description: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" });
          return;
        }
        const { error } = await signUpWithEmail(form.email, form.password, form.name);
        if (error) {
          toast({ title: "ত্রুটি", description: error, variant: "destructive" });
        } else {
          toast({ title: "✅ রেজিস্ট্রেশন সফল!", description: "আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে।" });
          setMode("login");
        }
      } else {
        const { error } = await signInWithEmail(form.email, form.password);
        if (error) {
          toast({ title: "ত্রুটি", description: error, variant: "destructive" });
        }
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 ring-4 ring-primary/20 mb-3 overflow-hidden">
            <img src={mangoLogo} alt="Sapahar Mango" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {mode === "register" ? "অ্যাকাউন্ট তৈরি করুন 🥭" : mode === "forgot" ? "পাসওয়ার্ড রিসেট 🔑" : "স্বাগতম! 🥭"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px] mx-auto">
            {mode === "register"
              ? "সাপাহারের সেরা আম অর্ডার করতে নতুন অ্যাকাউন্ট তৈরি করুন"
              : mode === "forgot"
              ? "আপনার ইমেইল দিন, পাসওয়ার্ড রিসেট লিংক পাঠানো হবে"
              : "সাপাহারের সেরা আম অর্ডার করতে লগইন করুন"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-5 sm:p-6 space-y-4">
          {/* Back button for forgot/register */}
          {mode !== "login" && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> লগইনে ফিরে যান
            </button>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">নাম</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="আপনার পুরো নাম"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">ইমেইল</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">পাসওয়ার্ড</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "register" ? "কমপক্ষে ৬ অক্ষর" : "আপনার পাসওয়ার্ড"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-9 pr-10"
                    required
                    minLength={mode === "register" ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={signingIn} className="w-full h-11 rounded-xl font-medium">
              {signingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "register" ? (
                "রেজিস্টার করুন"
              ) : mode === "forgot" ? (
                "রিসেট লিংক পাঠান"
              ) : (
                "লগইন করুন"
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          {mode !== "forgot" && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">অথবা</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={signingIn}
                className="w-full h-11 gap-3 bg-card hover:bg-muted text-foreground border border-border shadow-sm rounded-xl transition-all duration-200 hover:shadow-md text-sm"
                variant="outline"
              >
                {signingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google দিয়ে {mode === "register" ? "রেজিস্টার" : "লগইন"} করুন
              </Button>

              {/* Switch mode */}
              <p className="text-center text-xs text-muted-foreground">
                {mode === "login" ? (
                  <>
                    নতুন ইউজার?{" "}
                    <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
                      অ্যাকাউন্ট তৈরি করুন
                    </button>
                  </>
                ) : (
                  <>
                    ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      লগইন করুন
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>

        {/* Benefits (shown only on login) */}
        {mode === "login" && (
          <div className="mt-5 space-y-2.5 px-1">
            {[
              { icon: Truck, text: "অর্ডার ট্র্যাক করুন রিয়েল-টাইমে", color: "text-primary", bg: "bg-primary/10" },
              { icon: ShieldCheck, text: "নিরাপদ ও দ্রুত চেকআউট", color: "text-secondary", bg: "bg-secondary/10" },
              { icon: Headphones, text: "অর্ডার হিস্ট্রি ও সাপোর্ট", color: "text-accent", bg: "bg-accent/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground mt-4 px-4">
          {mode === "register" ? "রেজিস্টার" : "লগইন"} করলে আপনি আমাদের{" "}
          <Link to="/about" className="text-primary hover:underline">শর্তাবলী</Link> ও{" "}
          <Link to="/about" className="text-primary hover:underline">গোপনীয়তা নীতিতে</Link> সম্মতি দিচ্ছেন
        </p>
      </div>
    </div>
  );
};

export default Login;
