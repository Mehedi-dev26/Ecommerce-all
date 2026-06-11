import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Check, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import VendorLiveSupportPanel from "./VendorLiveSupportPanel";

interface Props {
  vendorId: string;
  vendorName?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const VendorNotificationCenter = ({ vendorId, vendorName }: Props) => {
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);

  const load = async () => {
    const { data } = await supabase
      .from("vendor_notifications" as any)
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as any) || []);

    const { data: thread } = await supabase
      .from("vendor_support_threads" as any)
      .select("unread_vendor")
      .eq("vendor_id", vendorId)
      .maybeSingle();
    setUnreadChat(((thread as any)?.unread_vendor as number) || 0);
  };

  useEffect(() => {
    if (!vendorId) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const unread = items.filter((i) => !i.is_read).length + unreadChat;

  const markAllRead = async () => {
    await supabase
      .from("vendor_notifications" as any)
      .update({ is_read: true })
      .eq("vendor_id", vendorId)
      .eq("is_read", false);
    load();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div>
              <div className="text-sm font-bold">নোটিফিকেশন</div>
              <div className="text-[11px] text-muted-foreground">
                {unread > 0 ? `${unread}টি নতুন` : "সব পড়া হয়েছে"}
              </div>
            </div>
            {items.some((i) => !i.is_read) && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-[11px]">
                <Check className="h-3 w-3 mr-1" /> সব পড়া
              </Button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">কোনো নোটিফিকেশন নেই</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    if (!n.is_read) {
                      await supabase.from("vendor_notifications" as any).update({ is_read: true }).eq("id", n.id);
                      load();
                    }
                    if (n.link) window.location.href = n.link;
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors",
                    !n.is_read && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-muted/20">
            <Button
              className="w-full justify-start gap-2 relative"
              onClick={() => {
                setOpen(false);
                setSupportOpen(true);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              লাইভ সাপোর্ট
              {unreadChat > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {unreadChat}
                </span>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <VendorLiveSupportPanel
        open={supportOpen}
        onClose={() => {
          setSupportOpen(false);
          load();
        }}
        vendorId={vendorId}
        vendorName={vendorName}
      />
    </>
  );
};

export default VendorNotificationCenter;
