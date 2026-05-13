import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorMini {
  id: string;
  shop_name: string;
  shop_name_bn: string;
  shop_slug: string;
}

/**
 * Fetch a map of vendor info for given vendor IDs (deduped).
 * Returns Record<vendor_id, VendorMini> — empty object if no IDs.
 */
export const useVendorsMap = (vendorIds: (string | null | undefined)[] | undefined) => {
  const ids = Array.from(new Set((vendorIds || []).filter(Boolean) as string[])).sort();
  return useQuery({
    queryKey: ["vendors-mini", ids],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("id,shop_name,shop_name_bn,shop_slug")
        .in("id", ids)
        .eq("status", "approved");
      const map: Record<string, VendorMini> = {};
      ((data as any) || []).forEach((v: VendorMini) => { map[v.id] = v; });
      return map;
    },
  });
};
