import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wallet, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";

interface PaymentAccount {
  id: string;
  method: "bkash" | "nagad" | "rocket";
  account_number: string;
  account_type: string;
  instructions_bn: string | null;
  logo_url: string | null;
}

interface Props {
  amount: number;
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  senderNumber: string;
  onSenderChange: (n: string) => void;
  senderError?: string;
}

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const METHOD_META: Record<Exclude<PaymentMethod, "cod">, {
  name: string;
  tagline: string;
  gradient: string;
  ring: string;
}> = {
  bkash: {
    name: "bKash",
    tagline: "Send Money",
    gradient: "from-pink-500 to-rose-600",
    ring: "ring-pink-500",
  },
  nagad: {
    name: "Nagad",
    tagline: "Send Money",
    gradient: "from-orange-500 to-amber-600",
    ring: "ring-orange-500",
  },
  rocket: {
    name: "Rocket",
    tagline: "Cash Out / Send",
    gradient: "from-purple-600 to-violet-700",
    ring: "ring-purple-500",
  },
};

export default function PaymentMethodPicker({
  amount,
  method,
  onMethodChange,
  senderNumber,
  onSenderChange,
  senderError,
}: Props) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("payment_accounts")
      .select("id, method, account_number, account_type, instructions_bn, logo_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAccounts((data || []) as PaymentAccount[]));
  }, []);

  const selectedAccount = accounts.find((a) => a.method === method);
  const senderValid = BD_PHONE_REGEX.test(senderNumber);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "নম্বর কপি হয়েছে", description: text });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-xl sm:text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        পেমেন্ট পদ্ধতি
      </h2>

      {/* Method cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* COD */}
        <button
          type="button"
          onClick={() => onMethodChange("cod")}
          className={`rounded-xl p-3 text-left transition-all bg-gradient-to-br from-emerald-500 to-green-600 text-white ${
            method === "cod" ? "ring-4 ring-emerald-500 ring-offset-2 ring-offset-background scale-[1.02] shadow-lg" : "opacity-80 hover:opacity-100"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">COD</div>
          <div className="text-base font-bold leading-tight mt-1">ক্যাশ অন<br/>ডেলিভারি</div>
        </button>

        {(["bkash", "nagad", "rocket"] as const).map((m) => {
          const meta = METHOD_META[m];
          const isActive = method === m;
          const available = accounts.some((a) => a.method === m);
          return (
            <button
              key={m}
              type="button"
              disabled={!available}
              onClick={() => onMethodChange(m)}
              className={`rounded-xl p-3 text-left transition-all bg-gradient-to-br ${meta.gradient} text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive ? `ring-4 ${meta.ring} ring-offset-2 ring-offset-background scale-[1.02] shadow-lg` : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90 flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {meta.tagline}
              </div>
              <div className="text-lg font-extrabold leading-tight mt-1">{meta.name}</div>
            </button>
          );
        })}
      </div>

      {/* Account details + sender number */}
      {method !== "cod" && selectedAccount && (
        <div className="mt-5 space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">পরিশোধ যোগ্য</p>
            <p className="text-4xl font-extrabold text-primary mt-1">৳ {amount.toLocaleString()}</p>
          </div>

          {/* Merchant number */}
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {selectedAccount.logo_url && (
                <img src={selectedAccount.logo_url} alt={METHOD_META[selectedAccount.method].name} className="w-12 h-12 rounded-lg object-contain bg-white p-1 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">আমাদের {METHOD_META[selectedAccount.method].name} নম্বর ({selectedAccount.account_type === "merchant" ? "Merchant" : selectedAccount.account_type === "agent" ? "Agent" : "Personal"})</p>
                <p className="text-2xl font-bold font-mono tracking-wider text-foreground select-all">
                  {selectedAccount.account_number}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={() => handleCopy(selectedAccount.account_number)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              কপি
            </Button>
          </div>

          {/* Instructions */}
          {selectedAccount.instructions_bn && (
            <div className="text-sm text-muted-foreground rounded-lg bg-muted/40 p-3 leading-relaxed whitespace-pre-line">
              {selectedAccount.instructions_bn}
            </div>
          )}

          {/* Sender number input */}
          <div>
            <Label htmlFor="sender-number" className="text-base font-semibold mb-1.5 block">
              আপনার {METHOD_META[selectedAccount.method].name} নম্বর *
            </Label>
            <div className="relative">
              <Input
                id="sender-number"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={senderNumber}
                maxLength={14}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.startsWith("880")) v = "0" + v.slice(3);
                  v = v.slice(0, 11);
                  onSenderChange(v);
                }}
                className={`h-12 text-lg font-mono tracking-wider ${
                  senderError ? "border-destructive" : senderValid ? "border-green-500" : ""
                }`}
              />
              {senderValid && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              যে নম্বর থেকে টাকা পাঠাবেন সেটি লিখুন। SMS এলে আমরা automatic verify করব।
            </p>
            {senderError && (
              <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {senderError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
