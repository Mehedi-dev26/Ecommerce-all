import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Loader2, PackageSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { optimizeRemoteImage } from "@/lib/image-url";
import { getProductUrl } from "@/lib/product-url";

type Product = {
  id: string;
  name: string;
  name_bn: string | null;
  price: number;
  image_url: string | null;
  serial_number?: number | null;
  vendor_id?: string | null;
  vendor_shop_slug?: string | null;
};


function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function useProductSearch(q: string) {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(q.trim(), 250);

  useEffect(() => {
    let cancelled = false;
    if (!debounced) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,name_bn,price,image_url")
        .eq("is_active", true)
        .or(`name.ilike.%${debounced}%,name_bn.ilike.%${debounced}%`)
        .limit(8);
      if (cancelled) return;
      setResults((data as Product[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return { results, loading, hasQuery: debounced.length > 0 };
}

const ResultRow = ({ p, onSelect }: { p: Product; onSelect: () => void }) => (
  <Link
    to={`/products/${p.id}`}
    onClick={onSelect}
    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-amber-50"
  >
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
      {p.image_url ? (
        <img src={optimizeRemoteImage(p.image_url)} alt={p.name_bn || p.name} className="h-full w-full object-cover" loading="lazy" />
      ) : null}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-semibold text-foreground">{p.name_bn || p.name}</div>
      <div className="truncate text-xs text-muted-foreground">{p.name}</div>
    </div>
    <div className="shrink-0 text-sm font-bold text-primary">৳{p.price}</div>
  </Link>
);

const ResultsList = ({
  loading,
  hasQuery,
  results,
  query,
  onSelect,
}: {
  loading: boolean;
  hasQuery: boolean;
  results: Product[];
  query: string;
  onSelect: () => void;
}) => {
  if (!hasQuery) {
    return (
      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
        পণ্যের নাম লিখে খুঁজুন
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> খোঁজা হচ্ছে…
      </div>
    );
  }
  if (!results.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
        <PackageSearch className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-semibold text-foreground">কোনো ফলাফল পাওয়া যায়নি</div>
        <div className="text-xs text-muted-foreground">"{query}" এর জন্য কোনো পণ্য নেই</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5 p-1.5">
      {results.map((p) => (
        <ResultRow key={p.id} p={p} onSelect={onSelect} />
      ))}
      <Link
        to={`/products?search=${encodeURIComponent(query)}`}
        onClick={onSelect}
        className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800 hover:bg-amber-100"
      >
        সব ফলাফল দেখুন →
      </Link>
    </div>
  );
};

/* ---------- Desktop inline variant ---------- */
export const DesktopSearchBar = () => {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { results, loading, hasQuery } = useProductSearch(q);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const open = focused && (hasQuery || !!q);

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            navigate(`/products?search=${encodeURIComponent(q.trim())}`);
            setFocused(false);
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-white/40 focus-within:ring-2 focus-within:ring-white"
      >
        <Search className="h-4 w-4 text-amber-700" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="পণ্য খুঁজুন... (যেমন: আম, মধু, খেজুর)"
          className="flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          aria-label="পণ্য সার্চ"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl">
          <ResultsList
            loading={loading}
            hasQuery={hasQuery}
            results={results}
            query={q}
            onSelect={() => {
              setFocused(false);
              setQ("");
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ---------- Mobile slide-down overlay ---------- */
export const MobileSearchOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading, hasQuery } = useProductSearch(q);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Slide down panel */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 flex max-h-[85vh] flex-col rounded-b-3xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "-translate-y-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              navigate(`/products?search=${encodeURIComponent(q.trim())}`);
              onClose();
            }
          }}
          className="flex items-center gap-2 border-b border-border px-3 py-3"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-amber-50/70 px-3 py-2 ring-1 ring-amber-200">
            <Search className="h-4 w-4 text-amber-700" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear" className="rounded p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            বাতিল
          </button>
        </form>
        <div className="flex-1 overflow-y-auto">
          <ResultsList
            loading={loading}
            hasQuery={hasQuery}
            results={results}
            query={q}
            onSelect={onClose}
          />
        </div>
      </div>
    </div>
  );
};
