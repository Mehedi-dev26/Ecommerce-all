import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalCategories: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0, totalCategories: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter((o) => o.status === "delivered").length;

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        completedOrders,
        totalCategories: categoriesRes.count || 0,
      });

      setRecentOrders(
        orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "মোট প্রোডাক্ট", value: stats.totalProducts, icon: Package, color: "text-primary" },
    { title: "মোট অর্ডার", value: stats.totalOrders, icon: ShoppingCart, color: "text-secondary" },
    { title: "মোট আয়", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-accent" },
    { title: "পেন্ডিং অর্ডার", value: stats.pendingOrders, icon: Clock, color: "text-orange-500" },
    { title: "সম্পন্ন অর্ডার", value: stats.completedOrders, icon: CheckCircle, color: "text-green-600" },
    { title: "ক্যাটাগরি", value: stats.totalCategories, icon: TrendingUp, color: "text-blue-500" },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      pending: "পেন্ডিং",
      processing: "প্রসেসিং",
      shipped: "শিপড",
      delivered: "ডেলিভারড",
      cancelled: "বাতিল",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">সাম্প্রতিক অর্ডার</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">কোনো অর্ডার নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">অর্ডার #</th>
                    <th className="text-left py-3 px-2">কাস্টমার</th>
                    <th className="text-left py-3 px-2">মোট</th>
                    <th className="text-left py-3 px-2">স্ট্যাটাস</th>
                    <th className="text-left py-3 px-2">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{order.order_number}</td>
                      <td className="py-3 px-2">{order.customer_name}</td>
                      <td className="py-3 px-2">৳{Number(order.total).toLocaleString()}</td>
                      <td className="py-3 px-2">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("bn-BD")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
