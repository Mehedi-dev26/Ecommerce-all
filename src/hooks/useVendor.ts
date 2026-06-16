import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VENDOR_LOAD_TIMEOUT_MS = 8000;

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, message: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });

export interface VendorRecord {
  id: string;
  user_id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  owner_name: string;
  phone: string;
  email: string;
  facebook_url: string | null;
  division: string;
  district: string;
  upazila: string;
  address: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason: string | null;
  commission_percent: number;
  total_orders: number;
  total_revenue: number;
  total_commission_earned: number;
}

export const useVendor = () => {
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setVendor(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await withTimeout(
        supabase
          .from("vendors" as any)
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        VENDOR_LOAD_TIMEOUT_MS,
        "Vendor profile load timed out"
      );
      setVendor((data as any) || null);
    } catch (error) {
      console.error("Failed to load vendor profile", error);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return { vendor, loading: loading || authLoading, refresh };
};
