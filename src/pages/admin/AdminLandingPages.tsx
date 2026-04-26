import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Eye, ExternalLink, Edit, Trash2, Search,
  TrendingUp, Users, ShoppingBag, DollarSign, Copy, Check,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AdminPageState from "@/components/admin/AdminPageState";

interface LandingPageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  theme_preset: string;
  view_count: number;
  order_count: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "ড্রাফট", cls: "bg-muted text-muted-foreground" },
  published: { label: "চালু", cls: "bg-primary/15 text-primary" },
  paused: { label: "বিরতি", cls: "bg-accent/15 text-accent-foreground" },
};

const AdminLandingPages = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("landing_pages")
      .select("id,slug,title,status,theme_preset,view_count,order_count,total_revenue,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("লোড করা যায়নি: " + error.message);
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("landing_pages").delete().eq("id", deleteId);
    if (error) {
      toast.error("ডিলিট ব্যর্থ: " + error.message);
    } else {
      toast.success("ল্যান্ডিং পেজ ডিলিট হয়েছে");
      setPages((p) => p.filter((x) => x.id !== deleteId));
    }
    setDeleteId(null);
  };

  const copyUrl = async (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success("URL কপি হয়েছে");
    setTimeout(() => setCopiedSlug(null), 1500);
  };

  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === "published").length,
    totalViews: pages.reduce((s, p) => s + (p.view_count || 0), 0),
    totalOrders: pages.reduce((s, p) => s + (p.order_count || 0), 0),
    totalRevenue: pages.reduce((s, p) => s + Number(p.total_revenue || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">ল্যান্ডিং পেজ</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Facebook Ad / Boost ক্যাম্পেইনের জন্য কাস্টম পেজ তৈরি করুন
          </p>
        </div>
        <Button onClick={() => navigate("/admin/landing-pages/new")} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          নতুন পেজ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            মোট পেজ
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-primary mt-0.5">{stats.published} চালু</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Eye className="h-3.5 w-3.5" />
            মোট ভিজিট
          </div>
          <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="h-3.5 w-3.5" />
            মোট অর্ডার
          </div>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.totalViews > 0
              ? `${((stats.totalOrders / stats.totalViews) * 100).toFixed(2)}% conv.`
              : "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            মোট রেভিনিউ
          </div>
          <div className="text-2xl font-bold">৳{Math.round(stats.totalRevenue).toLocaleString()}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="পেজ সার্চ করুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <AdminPageState loading message="লোড হচ্ছে..." />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-1">
            {search ? "কোনো ফলাফল পাওয়া যায়নি" : "এখনো কোনো ল্যান্ডিং পেজ নেই"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Facebook Ad এর জন্য আকর্ষণীয় ল্যান্ডিং পেজ তৈরি করুন এবং বিক্রি বাড়ান
          </p>
          {!search && (
            <Button onClick={() => navigate("/admin/landing-pages/new")}>
              <Plus className="h-4 w-4 mr-1.5" /> প্রথম পেজ তৈরি করুন
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => {
            const conv =
              p.view_count > 0 ? ((p.order_count / p.view_count) * 100).toFixed(2) : "0.00";
            const cfg = statusConfig[p.status] || statusConfig.draft;
            return (
              <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <Badge variant="outline" className={cfg.cls + " border-0"}>{cfg.label}</Badge>
                    </div>
                    <button
                      onClick={() => copyUrl(p.slug)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <code className="bg-muted px-1.5 py-0.5 rounded">/lp/{p.slug}</code>
                      {copiedSlug === p.slug ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {p.view_count.toLocaleString()} ভিউ
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {p.order_count} অর্ডার
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {conv}% conv.
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ৳{Math.round(Number(p.total_revenue)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/lp/${p.slug}`, "_blank")}
                        className="h-8"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/landing-pages/${p.id}`)}
                      className="h-8"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(p.id)}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ল্যান্ডিং পেজ ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই কাজটি অপরিবর্তনীয়। পেজটি স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              ডিলিট
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLandingPages;
