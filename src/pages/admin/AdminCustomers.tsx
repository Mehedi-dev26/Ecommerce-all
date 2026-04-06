import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Phone, MapPin, ShoppingBag } from "lucide-react";

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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">কাস্টমার তালিকা</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="কাস্টমার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4">কাস্টমার</th>
                  <th className="text-left py-3 px-4">ফোন</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">শহর</th>
                  <th className="text-left py-3 px-4">অর্ডার</th>
                  <th className="text-left py-3 px-4">মোট খরচ</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">শেষ অর্ডার</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.customer_phone} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <p className="font-medium">{c.customer_name}</p>
                      {c.customer_email && <p className="text-xs text-muted-foreground">{c.customer_email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.customer_phone}</div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{c.totalOrders}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">৳{c.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {new Date(c.lastOrder).toLocaleDateString("bn-BD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো কাস্টমার পাওয়া যায়নি</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
