import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Headphones, MessageCircle, Bot, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const SupportChatPanel = lazy(() => import("./SupportChatPanel"));

const WHATSAPP_NUMBER = "8801798268989";

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Preload chat panel when menu opens for instant launch
  useEffect(() => {
    if (open && !chatMounted) setChatMounted(true);
  }, [open, chatMounted]);

  // Close menu on outside click / Esc
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

  const openChat = () => {
    setChatMounted(true);
    setChatOpen(true);
    setOpen(false);
  };

  // Uniform button styling — same width, height, alignment
  const btnBase =
    "flex w-44 items-center gap-2.5 rounded-full py-2 pl-2 pr-3 text-xs font-semibold shadow-lg transition-transform hover:scale-105";
  const iconWrap = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";

  return (
    <>
      <div
        ref={ref}
        className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
      >
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
            className={cn(btnBase, "bg-[#25D366] text-white shadow-[#25D366]/30")}
          >
            <span className={cn(iconWrap, "bg-white/20")}>
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-left">WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={openChat}
            className={cn(btnBase, "bg-primary text-primary-foreground shadow-primary/30")}
          >
            <span className={cn(iconWrap, "bg-white/20")}>
              <Bot className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-left">AI Assistant</span>
          </button>

          <a
            href="tel:+8801798268989"
            onClick={() => setOpen(false)}
            className={cn(btnBase, "bg-accent text-accent-foreground shadow-accent/30")}
          >
            <span className={cn(iconWrap, "bg-black/10")}>
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-left">Call Us</span>
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
          {!open && !chatOpen && (
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
          )}
        </button>
      </div>

      {/* Chat panel — mounted once opened, kept in DOM for instant reopen */}
      {chatMounted && (
        <Suspense fallback={null}>
          <SupportChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default SupportWidget;
