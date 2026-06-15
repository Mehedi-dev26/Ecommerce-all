import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PromoStripRow {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  position: string;
  sort_order: number;
}

interface Props {
  position: "top" | "bottom";
  className?: string;
  /** When true, render without the outer container/padding — for embedding inside another section */
  inline?: boolean;
}

const PromoStrip = ({ position, className = "", inline = false }: Props) => {
  const [strips, setStrips] = useState<PromoStripRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("promo_strips")
        .select("id,image_url,link_url,alt_text,position,sort_order")
        .eq("is_active", true)
        .eq("position", position)
        .order("sort_order");
      if (mounted && data) setStrips(data as PromoStripRow[]);
    })();
    return () => {
      mounted = false;
    };
  }, [position]);

  if (strips.length === 0) return null;

  return (
    <section className={`container mx-auto px-3 sm:px-4 my-4 sm:my-6 ${className}`}>
      <div className="flex flex-col gap-3">
        {strips.map((s) => {
          const img = (
            <img
              src={s.image_url}
              alt={s.alt_text || "অফার ব্যানার"}
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover rounded-xl shadow-sm hover:shadow-md transition-shadow"
              style={{ aspectRatio: "8 / 1" }}
            />
          );
          return s.link_url ? (
            <Link key={s.id} to={s.link_url} className="block">
              {img}
            </Link>
          ) : (
            <div key={s.id}>{img}</div>
          );
        })}
      </div>
    </section>
  );
};

export default PromoStrip;
