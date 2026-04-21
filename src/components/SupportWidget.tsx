import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Headphones, MessageCircle, Bot, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "8801798268989"; // wa.me format (no +)

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* Action menu */}
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            "আসসালামু আলাইকুম, আমি Surzo Shop সম্পর্কে জানতে চাই।",
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 rounded-full bg-[#25D366] py-2.5 pl-3 pr-4 text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">WhatsApp</span>
        </a>

        <Link
          to="/support-chat"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 rounded-full bg-primary py-2.5 pl-3 pr-4 text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">AI Assistant</span>
        </Link>

        <a
          href="tel:+8801798268989"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 rounded-full bg-accent py-2.5 pl-3 pr-4 text-accent-foreground shadow-lg shadow-accent/30 transition-transform hover:scale-105"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10">
            <Phone className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Call Us</span>
        </a>
      </div>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support" : "Open support"}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition-all hover:scale-110 active:scale-95",
          open && "rotate-90",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
        {!open && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
        )}
      </button>
    </div>
  );
};

export default SupportWidget;
