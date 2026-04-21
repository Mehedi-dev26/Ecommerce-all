import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Send, ArrowLeft, Loader2, Sparkles, Phone, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
const WHATSAPP_NUMBER = "8801798268989";

const QUICK_PROMPTS = [
  "আপনাদের কাছে কি smartphone আছে?",
  "Delivery charge কত?",
  "Payment কীভাবে করব?",
  "অর্ডার কীভাবে দেব?",
];

const SupportChat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "আসসালামু আলাইকুম! 👋 আমি **Surzo Assistant**, আপনার AI সহকারী। পণ্য, দাম, ডেলিভারি বা অর্ডার সম্পর্কিত যেকোনো প্রশ্ন করতে পারেন।",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

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
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== messages[messages.length - 1]?.content) {
          // already streaming — replace last
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
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
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gradient-to-b from-background to-muted/30 sm:h-[calc(100vh-4.5rem)]">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-3 py-3 sm:px-4">
          <Link to="/" className="rounded-full p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm sm:text-base truncate">Surzo Assistant</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              AI সহকারী • সবসময় Online
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white hover:scale-105 transition"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href="tel:+8801798268989"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground hover:scale-105 transition"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2 sm:gap-3",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%]",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-card border",
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
            <div className="flex gap-2 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          )}

          {/* Quick prompts only at start */}
          {messages.length === 1 && (
            <div className="pt-2">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> দ্রুত প্রশ্ন
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
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
      <div className="border-t bg-card/95 backdrop-blur">
        <div className="container mx-auto max-w-2xl px-3 py-3 sm:px-4">
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
              className="min-h-[44px] max-h-32 resize-none rounded-2xl"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-11 w-11 shrink-0 rounded-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            AI সহায়তা সবসময় সঠিক নাও হতে পারে — গুরুত্বপূর্ণ তথ্য যাচাই করে নিন
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
