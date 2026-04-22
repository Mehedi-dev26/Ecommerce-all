import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Truck, Headphones, Eye, EyeOff, Mail, Lock, User, ArrowLeft, ShoppingBag, Star, Award, Heart, Phone, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getGuestAuthEmailCandidates, getGuestAuthPassword } from "@/lib/guest-auth";

type AuthMode = "login" | "register" | "forgot";

const Login = () => {
  const { signInWithGoogle, signInWithEmail, resetPassword, user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [signingIn, setSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // `identifier` accepts either an email OR a Bangladesh mobile number (01XXXXXXXXX)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", identifier: "" });

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

  const validatePhone = (phone: string) => {
    // Bangladesh phone: 11 digits starting with 01
    const cleaned = phone.replace(/\D/g, "");
    return /^01[3-9]\d{8}$/.test(cleaned);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSigningIn(true);
    try {
      if (mode === "phone") {
        // Phone + 4-digit PIN login (for accounts auto-created at checkout)
        if (!validatePhone(form.phone)) {
          toast({ title: "ত্রুটি", description: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)", variant: "destructive" });
          setSigningIn(false);
          return;
        }
        if (!/^\d{4}$/.test(form.pin)) {
          toast({ title: "ত্রুটি", description: "৪ ডিজিটের PIN দিন", variant: "destructive" });
          setSigningIn(false);
          return;
        }
        const cleanedPhone = form.phone.replace(/\D/g, "");
        const password = getGuestAuthPassword(form.pin);
        let loginError: Error | null = null;

        for (const emailCandidate of getGuestAuthEmailCandidates(cleanedPhone)) {
          const { error } = await supabase.auth.signInWithPassword({
            email: emailCandidate,
            password,
          });

          if (!error) {
            loginError = null;
            break;
          }

          loginError = error;
          if (!error.message.toLowerCase().includes("invalid")) {
            break;
          }
        }

        if (loginError) {
          toast({ title: "লগইন ব্যর্থ", description: "মোবাইল নম্বর বা PIN ভুল। অনুগ্রহ করে আবার চেষ্টা করুন।", variant: "destructive" });
        }
      } else if (mode === "forgot") {
        if (!form.email.trim()) return;
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
          setSigningIn(false);
          return;
        }
        if (!validatePhone(form.phone)) {
          toast({ title: "ত্রুটি", description: "সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)", variant: "destructive" });
          setSigningIn(false);
          return;
        }
        if (!form.email.trim()) {
          toast({ title: "ত্রুটি", description: "ইমেইল দিন", variant: "destructive" });
          setSigningIn(false);
          return;
        }
        if (form.password.length < 6) {
          toast({ title: "ত্রুটি", description: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", variant: "destructive" });
          setSigningIn(false);
          return;
        }

        const cleanedPhone = form.phone.replace(/\D/g, "");
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.name, phone: cleanedPhone },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
        } else {
          if (data.user) {
            await supabase
              .from("profiles")
              .upsert({ user_id: data.user.id, full_name: form.name, phone: cleanedPhone }, { onConflict: "user_id" });
            await refreshProfile();
          }
          toast({ title: "✅ রেজিস্ট্রেশন সফল!", description: "আপনার ইমেইল চেক করুন ভেরিফিকেশন লিংকের জন্য।" });
          setMode("login");
        }
      } else {
        if (!form.email.trim()) return;
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
    <div className="min-h-[85vh] flex">
      {/* Left Panel - Brand (Desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-gradient-to-br from-primary/95 via-primary to-accent/80 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-primary-foreground/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-10 xl:px-16 py-12 w-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
              <ShoppingBag className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-brand text-4xl font-bold tracking-tight text-white drop-shadow-md">Surzo Shop</h2>
              <p className="text-sm text-white/80 tracking-wide">সেরা পণ্য, সেরা দামে</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-[2.5rem] font-bold leading-[1.3] mb-5">
            <span className="text-white">আপনার পছন্দের সব পণ্য</span><br />
            <span className="text-yellow-200/90">এখন এক ক্লিকেই হাতের নাগালে</span>
          </h1>
          <p className="text-white/75 text-[15px] leading-relaxed mb-12 max-w-md">
            স্মার্টফোন, ল্যাপটপ, হোম অ্যাপ্লায়েন্স এবং আরও অনেক কিছু — অরিজিনাল প্রোডাক্ট, সেরা দামে সারাদেশে দ্রুত ডেলিভারি।
          </p>

          <div className="space-y-5">
            {[
              { icon: ShieldCheck, title: "১০০% অরিজিনাল প্রোডাক্ট", desc: "অথেন্টিক ও মান যাচাইকৃত পণ্য" },
              { icon: Truck, title: "সারাদেশে দ্রুত হোম ডেলিভারি", desc: "নিরাপদ ও দ্রুত কুরিয়ার সার্ভিস" },
              { icon: Zap, title: "ক্যাশ অন ডেলিভারি সুবিধা", desc: "পণ্য হাতে পেয়ে পেমেন্টের অপশন" },
              { icon: Award, title: "প্রতিযোগিতামূলক সেরা দাম", desc: "মার্কেটে সবচেয়ে সাশ্রয়ী মূল্য" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-white">{item.title}</h3>
                  <p className="text-[13px] text-white/60 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
            <div className="flex items-center gap-1 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              ))}
            </div>
            <p className="text-[13px] text-white/85 italic leading-relaxed">
              "অসাধারণ সার্ভিস! অরিজিনাল প্রোডাক্ট এবং দ্রুত ডেলিভারি পেয়েছি। প্যাকেজিং খুবই ভালো ছিল। নিশ্চয়ই আবার অর্ডার করবো।"
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">সন্তুষ্ট গ্রাহক</p>
                <p className="text-[11px] text-white/50">ঢাকা, বাংলাদেশ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[55%] xl:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-background to-muted/50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 min-h-full flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-[420px]">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 ring-4 ring-primary/20 mb-3 shadow-md">
                <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={2.5} />
              </div>
              <p className="font-brand text-3xl text-primary font-bold">Surzo Shop</p>
              <p className="text-xs text-muted-foreground tracking-wide mt-0.5">সেরা পণ্য, সেরা দামে</p>
            </div>

            {/* Heading */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {mode === "register" ? "অ্যাকাউন্ট তৈরি করুন" : mode === "forgot" ? "পাসওয়ার্ড রিসেট" : mode === "phone" ? "দ্রুত লগইন" : "ইমেইল লগইন"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {mode === "register"
                  ? "মোবাইল নম্বর দিয়ে অ্যাকাউন্ট খুলে কেনাকাটা শুরু করুন"
                  : mode === "forgot"
                  ? "আপনার ইমেইল দিন, রিসেট লিংক পাঠানো হবে"
                  : mode === "phone"
                  ? "মোবাইল নম্বর ও ৪ ডিজিটের PIN দিয়ে লগইন করুন"
                  : "ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন"}
              </p>
            </div>

            {/* Auth Card */}
            <div className="rounded-2xl border border-border/50 shadow-xl p-5 sm:p-7 space-y-5 bg-card/95 backdrop-blur-sm">
              {(mode === "forgot" || mode === "register") && (
                <button
                  onClick={() => setMode("phone")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> লগইনে ফিরে যান
                </button>
              )}

              {/* Tab switcher between Phone and Email login */}
              {(mode === "phone" || mode === "login") && (
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/50">
                  <button
                    type="button"
                    onClick={() => setMode("phone")}
                    className={`h-9 rounded-lg text-xs font-medium transition-all ${mode === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    📱 মোবাইল + PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`h-9 rounded-lg text-xs font-medium transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    ✉️ ইমেইল
                  </button>
                </div>
              )}

              {mode !== "forgot" && mode !== "phone" && (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={signingIn}
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-xl text-sm font-medium border-2 border-border bg-background text-foreground hover:bg-muted/60 hover:border-primary/30 transition-all duration-200 shadow-sm disabled:opacity-50"
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
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">অথবা ইমেইল দিয়ে</span>
                    </div>
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === "phone" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone-login" className="text-xs font-medium text-muted-foreground">মোবাইল নম্বর <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="phone-login"
                          type="tel"
                          inputMode="numeric"
                          placeholder="01XXXXXXXXX"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                          className="pl-10 h-11 rounded-xl"
                          maxLength={11}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pin-login" className="text-xs font-medium text-muted-foreground">৪ ডিজিটের PIN <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="pin-login"
                          type="password"
                          inputMode="numeric"
                          placeholder="••••"
                          value={form.pin}
                          onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                          className="pl-10 h-11 rounded-xl text-center tracking-[0.4em] font-mono"
                          maxLength={4}
                          required
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">অর্ডার করার সময় যে PIN সেট করেছিলেন সেটি দিন</p>
                    </div>
                  </>
                )}

                {mode === "register" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">পুরো নাম <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="name" placeholder="আপনার পুরো নাম" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-10 h-11 rounded-xl" required />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium text-foreground flex items-center gap-1">
                        মোবাইল নম্বর <span className="text-destructive">*</span>
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">অর্ডারের জন্য জরুরি</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="01XXXXXXXXX"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                          className="pl-10 h-11 rounded-xl border-primary/30 focus-visible:ring-primary"
                          maxLength={11}
                          required
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">ডেলিভারি ও যোগাযোগের জন্য ব্যবহৃত হবে</p>
                    </div>
                  </>
                )}

                {mode !== "phone" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">ইমেইল {mode === "register" && <span className="text-destructive">*</span>}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                )}

                {mode !== "forgot" && mode !== "phone" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">পাসওয়ার্ড</Label>
                      {mode === "login" && (
                        <button type="button" onClick={() => setMode("forgot")} className="text-[11px] text-primary hover:underline font-medium">
                          পাসওয়ার্ড ভুলে গেছেন?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder={mode === "register" ? "কমপক্ষে ৬ অক্ষর" : "আপনার পাসওয়ার্ড"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 rounded-xl" required minLength={mode === "register" ? 6 : undefined} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={signingIn} className="w-full h-12 rounded-xl font-semibold text-sm">
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

              {mode !== "forgot" && (
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "register" ? (
                    <>
                      ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
                      <button type="button" onClick={() => setMode("phone")} className="text-primary font-semibold hover:underline">
                        লগইন করুন
                      </button>
                    </>
                  ) : (
                    <>
                      নতুন ইউজার?{" "}
                      <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">
                        অ্যাকাউন্ট তৈরি করুন
                      </button>
                    </>
                  )}
                </p>
              )}
            </div>

            {(mode === "login" || mode === "phone") && (
              <div className="mt-5 grid grid-cols-3 gap-3 lg:hidden">
                {[
                  { icon: Truck, text: "দ্রুত ডেলিভারি", color: "text-primary", bg: "bg-primary/10" },
                  { icon: ShieldCheck, text: "নিরাপদ পেমেন্ট", color: "text-secondary", bg: "bg-secondary/10" },
                  { icon: Headphones, text: "২৪/৭ সাপোর্ট", color: "text-accent", bg: "bg-accent/10" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center p-3 rounded-xl bg-card border border-border/30">
                    <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[11px] text-muted-foreground mt-5 px-4">
              {mode === "register" ? "রেজিস্টার" : "লগইন"} করলে আপনি আমাদের{" "}
              <Link to="/about" className="text-primary hover:underline">শর্তাবলী</Link> ও{" "}
              <Link to="/about" className="text-primary hover:underline">গোপনীয়তা নীতিতে</Link> সম্মতি দিচ্ছেন
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
