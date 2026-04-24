import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2, Sparkles, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
  pending?: PendingConfirmation[];
}
interface PendingConfirmation {
  id: string;
  name: string;
  arguments: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/admin-ai-assistant`;

const TOOL_LABELS: Record<string, string> = {
  create_product: "নতুন প্রোডাক্ট তৈরি করুন",
  update_product: "প্রোডাক্ট আপডেট করুন",
  delete_product: "প্রোডাক্ট ডিলিট করুন",
  update_order_status: "অর্ডার স্ট্যাটাস বদলান",
  moderate_review: "রিভিউ মডারেট করুন",
};

function summarizeArgs(name: string, args: any): string {
  try {
    const a = typeof args === "string" ? JSON.parse(args) : args;
    if (name === "create_product") return `${a.name_bn || a.name} • ৳${a.price} • Stock: ${a.stock}`;
    if (name === "update_product") return Object.keys(a).filter(k => k !== "product_id").map(k => `${k}: ${a[k]}`).join(" • ");
    if (name === "delete_product") return `Product ID: ${a.product_id?.slice(0, 8)}…`;
    if (name === "update_order_status") return `${a.order_id} → ${a.status}`;
    if (name === "moderate_review") return `${a.action} • Review ${a.review_id?.slice(0, 8)}…`;
    return JSON.stringify(a);
  } catch {
    return String(args);
  }
}

const AdminAIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "আসসালামু আলাইকুম! আমি আপনার Surzo Admin AI। প্রোডাক্ট, অর্ডার, রিভিউ — যেকোনো কাজে বলুন, আমি করে দিচ্ছি ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const callApi = async (body: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Session expired. Please log in again.");

    const r = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const apiMessages = next.map(m => ({ role: m.role, content: m.content }));
      const data = await callApi({ messages: apiMessages });
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.assistant_message || "✓",
          pending: data.pending_confirmations,
        },
      ]);
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (msgIdx: number, conf: PendingConfirmation) => {
    setConfirming(conf.id);
    try {
      const data = await callApi({ confirmedToolCall: conf, messages: [] });
      const result = data.tool_result;
      const ok = result?.ok;
      const summary = ok
        ? `✅ ${result.message || "Done"}`
        : `❌ ${result?.error || "Failed"}`;

      // remove this pending from the message and append result
      setMessages(prev => {
        const copy = [...prev];
        if (copy[msgIdx]?.pending) {
          copy[msgIdx] = {
            ...copy[msgIdx],
            pending: copy[msgIdx].pending!.filter(p => p.id !== conf.id),
          };
        }
        return [...copy, { role: "assistant" as const, content: summary }];
      });
      toast({ title: ok ? "সম্পন্ন" : "ব্যর্থ", description: result?.message || result?.error });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setConfirming(null);
    }
  };

  const cancelAction = (msgIdx: number, confId: string) => {
    setMessages(prev => {
      const copy = [...prev];
      if (copy[msgIdx]?.pending) {
        copy[msgIdx] = {
          ...copy[msgIdx],
          pending: copy[msgIdx].pending!.filter(p => p.id !== confId),
        };
      }
      return [...copy, { role: "assistant" as const, content: "❌ Action cancelled." }];
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform group"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-0 lg:inset-auto lg:bottom-6 lg:right-6 z-50 lg:h-[640px] lg:w-[420px] lg:max-h-[85vh]">
          <div className="h-full w-full bg-card lg:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Surzo Admin AI</h3>
                <p className="text-[11px] opacity-90">আপনার সহকারী • Online</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" viewportRef={scrollRef as any}>
              <div ref={scrollRef as any} className="p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm",
                      )}
                    >
                      {m.content}
                      {m.pending && m.pending.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {m.pending.map(p => (
                            <div
                              key={p.id}
                              className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-3 text-foreground"
                            >
                              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <Sparkles className="h-3 w-3" />
                                {TOOL_LABELS[p.name] || p.name}
                              </div>
                              <div className="text-[12px] text-muted-foreground mt-1 mb-2.5 break-words">
                                {summarizeArgs(p.name, p.arguments)}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs flex-1"
                                  onClick={() => confirmAction(i, p)}
                                  disabled={confirming === p.id}
                                >
                                  {confirming === p.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 mr-1" /> Confirm
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => cancelAction(i, p.id)}
                                  disabled={confirming === p.id}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="shrink-0 border-t border-border p-3 bg-card">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="যেমন: Sony headphone add koro 2500 takay"
                  rows={1}
                  className="resize-none min-h-[40px] max-h-32 text-sm"
                  disabled={loading}
                />
                <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="shrink-0 h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                🔒 শুধু admin access • প্রতিটি action confirm করতে হবে
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAIAssistant;
