import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2, Sparkles, Phone, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
const WHATSAPP_NUMBER = "8801720565997";

const QUICK_PROMPTS = [
  "কোন আম এখন available?",
  "Delivery charge কত?",
  "Payment method কী কী?",
  "অর্ডার কীভাবে দেব?",
];

const INITIAL_MSG: Msg = {
  role: "assistant",
  content:
    "আসসালামু আলাইকুম! 👋 আমি **Sapahar Shop Assistant**। আম, দাম, ডেলিভারি বা অর্ডার সম্পর্কে যেকোনো প্রশ্ন করুন।",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const SupportChatPanel = ({ open, onClose }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes + desktop outside-click closes
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      // Desktop only — mobile uses backdrop
      if (window.innerWidth < 640) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Ignore clicks on the support widget trigger area (bottom-right)
        const widget = document.querySelector('[aria-label="Open support"], [aria-label="Close support"]');
        if (widget && (widget.contains(target) || widget === target)) return;
        onClose();
      }
    };
    document.addEventListener("keydown", onEsc);
    // Delay binding so the opening click doesn't immediately close it
    const t = setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("mousedown", onClick);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = "";
    let started = false;
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        if (!started) {
          started = true;
          return [...prev, { role: "assistant", content: assistantSoFar }];
        }
        return prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
        );
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (resp.status === 429) {
        toast.error("একটু পরে আবার চেষ্টা করুন");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credit শেষ — Workspace Settings এ credit যোগ করুন");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as any)?.name !== "AbortError") {
        console.error(e);
        toast.error("Chat error — পরে চেষ্টা করুন");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm transition-opacity sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel: full-screen on mobile, compact side-panel on desktop */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-[71] flex flex-col bg-background shadow-2xl transition-all duration-300",
          // Mobile: full screen
          "inset-0 sm:inset-auto",
          // Desktop: compact bottom-right panel
          "sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-8rem)] sm:w-[380px] sm:rounded-2xl sm:border",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0 sm:translate-y-8",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b bg-primary px-3 py-3 text-primary-foreground sm:rounded-t-2xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">Sapahar Shop Assistant</h2>
            <p className="flex items-center gap-1.5 text-[11px] opacity-90">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              AI সহকারী • Online
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 px-3 py-3"
        >
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border bg-card",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="pt-1">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> দ্রুত প্রশ্ন
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-card/95 px-3 py-2.5 sm:rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="আপনার প্রশ্ন লিখুন..."
              rows={1}
              className="min-h-[40px] max-h-28 resize-none rounded-2xl text-sm"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">
            AI উত্তর সবসময় সঠিক নাও হতে পারে
          </p>
        </div>
      </div>
    </>
  );
};

export default SupportChatPanel;
