import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Headphones, MessageCircle, Bot, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const SupportChatPanel = lazy(() => import("./SupportChatPanel"));

const WHATSAPP_NUMBER = "8801720565997";

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !chatMounted) setChatMounted(true);
  }, [open, chatMounted]);

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

  // Compact icon-only circular buttons — uniform size & alignment
  const iconBtn =
    "group relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95";
  const tooltip =
    "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100";

  return (
    <>
      <div
        ref={ref}
        className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
      >
        {/* Action menu — icon-only buttons */}
        <div
          className={cn(
            "flex flex-col items-end gap-2.5 transition-all duration-300",
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0",
          )}
        >
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "আসসালামু আলাইকুম, আমি Sapahar Shop সম্পর্কে জানতে চাই।",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            aria-label="WhatsApp"
            className={cn(iconBtn, "bg-[#25D366] shadow-[#25D366]/40")}
          >
            <MessageCircle className="h-5 w-5" />
            <span className={tooltip}>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={openChat}
            aria-label="AI Assistant"
            className={cn(iconBtn, "bg-primary shadow-primary/40")}
          >
            <Bot className="h-5 w-5" />
            <span className={tooltip}>AI Assistant</span>
          </button>

          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            onClick={() => setOpen(false)}
            aria-label="Call Us"
            className={cn(iconBtn, "bg-accent text-accent-foreground shadow-accent/40")}
          >
            <Phone className="h-5 w-5" />
            <span className={tooltip}>Call Us</span>
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
        </button>
      </div>

      {chatMounted && (
        <Suspense fallback={null}>
          <SupportChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default SupportWidget;
