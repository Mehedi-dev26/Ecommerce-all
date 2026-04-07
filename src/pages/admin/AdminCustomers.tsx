import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Phone, MapPin, ShoppingBag, Users, TrendingUp, Crown } from "lucide-react";

interface Customer {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: orders } = await supabase.from("orders").select("customer_name, customer_phone, customer_email, city, total, created_at");
      if (!orders) { setLoading(false); return; }

      const map = new Map<string, Customer>();
      for (const o of orders) {
        const key = o.customer_phone;
        const existing = map.get(key);
        if (existing) {
          existing.totalOrders++;
          existing.totalSpent += Number(o.total);
          if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
        } else {
          map.set(key, {
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            customer_email: o.customer_email,
            city: o.city,
            totalOrders: 1,
            totalSpent: Number(o.total),
            lastOrder: o.created_at,
          });
        }
      }

      setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) => c.customer_name.includes(search) || c.customer_phone.includes(search)
  );

  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpent = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="animate-spin h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full" />
      <p className="text-sm text-muted-foreground">কাস্টমার লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{customers.length}</p>
            <p className="text-xs text-muted-foreground">মোট কাস্টমার</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-xl font-bold">৳{totalSpentAll.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">মোট ব্যয়</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold">৳{avgSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">গড় ব্যয়</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{customers.filter((c) => c.totalOrders > 1).length}</p>
            <p className="text-xs text-muted-foreground">রিটার্ন কাস্টমার</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} জন কাস্টমার দেখানো হচ্ছে</p>

      {/* Customer Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">কাস্টমার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ফোন</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">শহর</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">অর্ডার</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">মোট খরচ</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">শেষ অর্ডার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((c, index) => (
                  <tr key={c.customer_phone} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {c.customer_name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{c.customer_name}</p>
                            {index === 0 && customers.length > 0 && (
                              <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          {c.customer_email && <p className="text-xs text-muted-foreground truncate">{c.customer_email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{c.customer_phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{c.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {c.totalOrders}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">৳{c.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(c.lastOrder).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোনো কাস্টমার পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
