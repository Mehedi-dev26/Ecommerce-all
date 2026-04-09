import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import mangoLogo from "@/assets/mango-logo.png";

const Login = () => {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  const from = (location.state as any)?.from || "/";

  // If already logged in, redirect
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
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <img src={mangoLogo} alt="Sapahar Mango" className="h-16 w-16 rounded-full object-contain bg-primary/10 ring-4 ring-primary/20 mx-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              লগইন করুন
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              অর্ডার করতে ও আপনার অর্ডার ট্র্যাক করতে লগইন করুন
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full h-12 text-base gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
            variant="outline"
          >
            {signingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              লগইন করলে আপনি আমাদের{" "}
              <span className="text-primary cursor-pointer">শর্তাবলী</span> ও{" "}
              <span className="text-primary cursor-pointer">গোপনীয়তা নীতিতে</span> সম্মতি দিচ্ছেন
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
