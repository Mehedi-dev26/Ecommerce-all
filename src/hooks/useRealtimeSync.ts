import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * useRealtimeSync
 * Subscribes to Supabase Realtime postgres_changes across core tables
 * so that additions, edits, or deletions in the admin panel or by other users
 * immediately reflect in the client UI without requiring hard refresh.
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Products channel
    const productsChannel = supabase
      .channel("realtime-products-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("[Realtime] Product changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["featured-products"] });
          queryClient.invalidateQueries({ queryKey: ["home-category-products"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
          queryClient.invalidateQueries({ queryKey: ["product"] });
        }
      )
      .subscribe();

    // 2. Categories channel
    const categoriesChannel = supabase
      .channel("realtime-categories-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          console.log("[Realtime] Categories changed");
          queryClient.invalidateQueries({ queryKey: ["home-categories"] });
          queryClient.invalidateQueries({ queryKey: ["home-category-products"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
          queryClient.invalidateQueries({ queryKey: ["footer-categories"] });
        }
      )
      .subscribe();

    // 3. Banners channel
    const bannersChannel = supabase
      .channel("realtime-banners-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banners" },
        () => {
          console.log("[Realtime] Banners changed");
          queryClient.invalidateQueries({ queryKey: ["home-banners"] });
          window.dispatchEvent(new CustomEvent("banners-updated"));
        }
      )
      .subscribe();

    // 4. Promo strips channel
    const promoChannel = supabase
      .channel("realtime-promo-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promo_strips" },
        () => {
          console.log("[Realtime] Promo strips changed");
          queryClient.invalidateQueries({ queryKey: ["promo-strips"] });
          window.dispatchEvent(new CustomEvent("promo-strips-updated"));
        }
      )
      .subscribe();

    // 5. Site Settings channel
    const settingsChannel = supabase
      .channel("realtime-settings-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          console.log("[Realtime] Site settings changed");
          queryClient.invalidateQueries({ queryKey: ["site-settings"] });
          window.dispatchEvent(new CustomEvent("site-settings-updated"));
        }
      )
      .subscribe();

    // 6. Customer reviews channel
    const reviewsChannel = supabase
      .channel("realtime-reviews-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_reviews" },
        () => {
          console.log("[Realtime] Customer reviews changed");
          queryClient.invalidateQueries({ queryKey: ["home-reviews"] });
          queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
          queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
          queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
          queryClient.invalidateQueries({ queryKey: ["product-review-stats"] });
        }
      )
      .subscribe();

    // 7. Orders channel (for admin & vendor live order updates)
    const ordersChannel = supabase
      .channel("realtime-orders-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          console.log("[Realtime] Orders changed");
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
          queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(bannersChannel);
      supabase.removeChannel(promoChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [queryClient]);
};
