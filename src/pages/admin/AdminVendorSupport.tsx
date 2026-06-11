import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Loader2, Search, MessageSquare, RefreshCw, Wand2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Thread {
  id: string;
  vendor_id: string;
  subject: string | null;
  status: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_admin: number;
  unread_vendor: number;
  vendor?: { shop_name_bn: string | null; shop_name: string | null; owner_name: string | null; logo_url: string | null };
}

interface Message {
  id: string;
  sender_role: "vendor" | "admin" | "system";
  sender_name: string | null;
  body: string;
  created_at: string;
}

const AdminVendorSupport = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    const { data } = await supabase
      .from("vendor_support_threads" as any)
      .select("*, vendor:vendors(shop_name_bn, shop_name, owner_name, logo_url)")
      .order("last_message_at", { ascending: false });
    setThreads((data as any) || []);
    setLoadingThreads(false);
  };

  const loadMessages = async (tid: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("vendor_support_messages" as any)
      .select("*")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });
    setMessages(((data as any) || []) as Message[]);
    await supabase.from("vendor_support_threads" as any).update({ unread_admin: 0 }).eq("id", tid);
    setLoadingMessages(false);
  };

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const activeThread = threads.find((t) => t.id === activeId);

  // Auto-suggest replies whenever a new vendor message arrives
  const lastMsg = messages[messages.length - 1];
  useEffect(() => {
    if (!activeThread || !lastMsg || lastMsg.sender_role !== "vendor") {
      return;
    }
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsg?.id]);

  const fetchSuggestions = async () => {
    if (!activeThread || messages.length === 0) return;
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("vendor-support-ai", {
        body: {
          messages: messages.map((m) => ({ role: m.sender_role, body: m.body })),
          vendorName: activeThread.vendor?.shop_name_bn || activeThread.vendor?.owner_name,
        },
      });
      if (error) throw error;
      setSuggestions(((data as any)?.suggestions as string[]) || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSuggestLoading(false);
    }
  };

  const send = async () => {
    const body = input.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("vendor_support_messages" as any).insert({
      thread_id: activeId,
      sender_role: "admin",
      sender_id: u.user?.id,
      sender_name: "Sapahar Admin",
      body,
    });
    if (error) toast.error(error.message);
    setInput("");
    setSuggestions([]);
    await loadMessages(activeId);
    setSending(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.vendor?.shop_name_bn, t.vendor?.shop_name, t.vendor?.owner_name, t.last_message_preview]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q)),
    );
  }, [threads, search]);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Thread list */}
      <Card className="w-[320px] shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> ভেন্ডর কথোপকথন
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadThreads}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ভেন্ডর খুঁজুন..."
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">কোনো কথোপকথন নেই</div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b hover:bg-muted/50 transition-colors",
                  activeId === t.id && "bg-primary/10",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {t.vendor?.logo_url ? (
                      <img src={t.vendor.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">
                        {t.vendor?.shop_name_bn || t.vendor?.shop_name || "ভেন্ডর"}
                      </p>
                      {t.unread_admin > 0 && (
                        <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{t.unread_admin}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.last_message_preview || "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(t.last_message_at).toLocaleString("bn-BD")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Conversation */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">একটি কথোপকথন নির্বাচন করুন</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-3 flex items-center gap-3 bg-muted/20">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {activeThread.vendor?.logo_url ? (
                  <img src={activeThread.vendor.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {activeThread.vendor?.shop_name_bn || activeThread.vendor?.shop_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{activeThread.vendor?.owner_name}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm",
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">
                          {m.sender_name || (mine ? "Admin" : "Vendor")}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={cn("text-[10px] mt-1", mine ? "opacity-70" : "text-muted-foreground")}>
                          {new Date(m.created_at).toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* AI suggestions */}
            <div className="border-t bg-gradient-to-r from-primary/5 to-transparent px-3 pt-2.5 pb-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> AI উত্তর সাজেশন
                </span>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={fetchSuggestions} disabled={suggestLoading}>
                  {suggestLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Wand2 className="h-3 w-3 mr-1" /> নতুন</>}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {suggestLoading && suggestions.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">AI চিন্তা করছে...</span>
                ) : suggestions.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">
                    ভেন্ডরের শেষ বার্তার পর সাজেশন স্বয়ংক্রিয়ভাবে আসবে
                  </span>
                ) : (
                  suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setInput((prev) => (prev ? prev + " " + s : s))}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-card border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-left max-w-full truncate"
                      title={s}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-t bg-card p-3">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="উত্তর লিখুন... (অথবা উপরের সাজেশন ক্লিক করুন)"
                  className="min-h-[44px] max-h-[160px] resize-none"
                />
                <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="h-11 w-11 shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminVendorSupport;
