import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Headphones, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName?: string;
}

interface Message {
  id: string;
  sender_role: "vendor" | "admin" | "system";
  body: string;
  sender_name?: string | null;
  created_at: string;
}

const VendorLiveSupportPanel = ({ open, onClose, vendorId, vendorName }: Props) => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ensureThread = async () => {
    const { data: existing } = await supabase
      .from("vendor_support_threads" as any)
      .select("id")
      .eq("vendor_id", vendorId)
      .maybeSingle();
    if (existing) return (existing as any).id as string;
    const { data: created } = await supabase
      .from("vendor_support_threads" as any)
      .insert({ vendor_id: vendorId, subject: "Live Support" })
      .select("id")
      .single();
    return (created as any).id as string;
  };

  const loadMessages = async (tid: string) => {
    const { data } = await supabase
      .from("vendor_support_messages" as any)
      .select("*")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });
    setMessages(((data as any) || []) as Message[]);
    // mark vendor-side unread = 0
    await supabase.from("vendor_support_threads" as any).update({ unread_vendor: 0 }).eq("id", tid);
  };

  useEffect(() => {
    if (!open || !vendorId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const tid = await ensureThread();
      if (cancelled) return;
      setThreadId(tid);
      await loadMessages(tid);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendorId]);

  useEffect(() => {
    if (!open || !threadId) return;
    const t = setInterval(() => loadMessages(threadId), 5000);
    return () => clearInterval(t);
  }, [open, threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = input.trim();
    if (!body || !threadId || sending) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("vendor_support_messages" as any).insert({
      thread_id: threadId,
      sender_role: "vendor",
      sender_id: u.user?.id,
      sender_name: vendorName || u.user?.email,
      body,
    });
    setInput("");
    await loadMessages(threadId);
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base">লাইভ সাপোর্ট</div>
              <div className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Sapahar Admin সাধারণত কয়েক মিনিটের মধ্যে উত্তর দেয়
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Headphones className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">আসসালামু আলাইকুম! 👋</p>
              <p className="text-xs mt-1">আপনার যেকোনো প্রশ্ন লিখুন — আমরা সাহায্য করব।</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_role === "vendor";
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border rounded-bl-sm",
                    )}
                  >
                    {!mine && (
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">
                        {m.sender_name || "Sapahar Admin"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn("text-[10px] mt-1", mine ? "opacity-70" : "text-muted-foreground")}>
                      {new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
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
              placeholder="আপনার বার্তা লিখুন..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="shrink-0 h-11 w-11">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VendorLiveSupportPanel;
