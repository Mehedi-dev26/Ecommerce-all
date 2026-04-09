import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Truck, Headphones } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.png";

const Login = () => {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  const from = (location.state as any)?.from || "/";

  if (!loading && user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 ring-4 ring-primary/20 mb-4 overflow-hidden">
            <img src={mangoLogo} alt="Sapahar Mango" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            স্বাগতম! 🥭
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
            সাপাহারের সেরা আম অর্ডার করতে আপনার অ্যাকাউন্টে লগইন করুন
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6 space-y-5">
          <Button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full h-12 text-sm sm:text-base gap-3 bg-card hover:bg-muted text-foreground border border-border shadow-sm rounded-xl transition-all duration-200 hover:shadow-md"
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
            Google দিয়ে লগইন করুন
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">কেন লগইন করবেন?</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">অর্ডার ট্র্যাক করুন রিয়েল-টাইমে</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-muted-foreground">নিরাপদ ও দ্রুত চেকআউট</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="h-4 w-4 text-accent" />
              </div>
              <span className="text-muted-foreground">অর্ডার হিস্ট্রি ও সাপোর্ট</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground mt-5 px-4">
          লগইন করলে আপনি আমাদের{" "}
          <Link to="/about" className="text-primary hover:underline">শর্তাবলী</Link> ও{" "}
          <Link to="/about" className="text-primary hover:underline">গোপনীয়তা নীতিতে</Link> সম্মতি দিচ্ছেন
        </p>
      </div>
    </div>
  );
};

export default Login;
