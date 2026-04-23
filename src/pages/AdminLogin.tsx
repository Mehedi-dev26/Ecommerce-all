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
import brandLogo from "@/assets/brand-logo.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-white ring-4 ring-primary/20 flex items-center justify-center shadow-md overflow-hidden">
              <img src={brandLogo} alt="Surzo Shop logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            <span className="font-brand text-primary text-4xl">Surzo Shop</span>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
