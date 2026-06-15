// Public SMS forwarder webhook. Receives raw SMS from an Android SMS Forwarder
// app, parses bKash / Nagad / Rocket payment confirmations, stores them in
// sms_inbox and auto-matches against pending orders.
//
// Required header: x-webhook-token (must match site_settings.sms_webhook_secret)
// Body (POST JSON):
//   { from?: string, message: string, received_at?: string, test?: boolean }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Parsed {
  provider: "bkash" | "nagad" | "rocket" | null;
  amount: number | null;
  txnId: string | null;
  senderNumber: string | null;
}

function normalizePhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("01")) return digits;
  if (digits.length === 13 && digits.startsWith("880")) return "0" + digits.slice(3);
  if (digits.length >= 11) return digits.slice(-11);
  return digits || null;
}

function parseAmount(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseSms(raw: string, from?: string): Parsed {
  const text = raw.replace(/\s+/g, " ").trim();
  const fromUpper = (from || "").toUpperCase();

  // bKash patterns (covers Personal & Merchant Cash In/Send Money)
  // e.g. "You have received Tk 1,500.00 from 01XXXXXXXXX. Fee Tk 0.00. Balance Tk ... TrxID 9A1B2C3D4 at 12:34"
  let m = text.match(/(?:received|cash[\s-]?in|payment received|money received).{0,60}?(?:tk\.?|৳)\s*([\d,.]+).{0,80}?(?:from|sender)[^\d]*(\d{11,13}).{0,80}?(?:trxid|trx id|txnid|trans?action id|trxn id)\s*[:\-]?\s*([A-Z0-9]{6,})/i);
  if (m || /bkash/i.test(fromUpper)) {
    if (m) {
      return { provider: "bkash", amount: parseAmount(m[1]), senderNumber: normalizePhone(m[2]), txnId: m[3].toUpperCase() };
    }
  }

  // Nagad: "Cash In Tk 500.00 from 01XXXXXXXXX successful. TxnID: 7AB12CD34 ..."
  m = text.match(/(?:cash in|money received|received|payment).{0,40}?(?:tk\.?|৳)\s*([\d,.]+).{0,80}?(?:from|sender)[^\d]*(\d{11,13}).{0,80}?(?:txnid|trxid|txn id|transaction id)\s*[:\-]?\s*([A-Z0-9]{6,})/i);
  if (m && /nagad/i.test(fromUpper + " " + text)) {
    return { provider: "nagad", amount: parseAmount(m[1]), senderNumber: normalizePhone(m[2]), txnId: m[3].toUpperCase() };
  }

  // Rocket: "You have received Tk.500 from A/C:017XXXXXXXX. TxnId:ABCD1234 ..."
  m = text.match(/(?:received|cash in).{0,40}?(?:tk\.?|৳)\s*([\d,.]+).{0,80}?(?:from|a\/c)[^\d]*(\d{11,13}).{0,80}?(?:txnid|trxid|txn id)\s*[:\-]?\s*([A-Z0-9]{6,})/i);
  if (m && /rocket|dbbl/i.test(fromUpper + " " + text)) {
    return { provider: "rocket", amount: parseAmount(m[1]), senderNumber: normalizePhone(m[2]), txnId: m[3].toUpperCase() };
  }

  // Generic fallback: try the loose amount+phone+txn pattern; provider inferred from sender
  m = text.match(/(?:tk\.?|৳)\s*([\d,.]+).{0,120}?(\d{11}).{0,120}?([A-Z0-9]{8,})/i);
  if (m) {
    let provider: Parsed["provider"] = null;
    if (/bkash/i.test(fromUpper)) provider = "bkash";
    else if (/nagad/i.test(fromUpper)) provider = "nagad";
    else if (/rocket|dbbl/i.test(fromUpper)) provider = "rocket";
    return { provider, amount: parseAmount(m[1]), senderNumber: normalizePhone(m[2]), txnId: m[3].toUpperCase() };
  }

  return { provider: null, amount: null, txnId: null, senderNumber: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Verify webhook secret
    const provided = req.headers.get("x-webhook-token") || "";
    const { data: secretRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "sms_webhook_secret")
      .maybeSingle();
    const expected = (secretRow?.value || "").toString();
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const raw = (body.message || body.text || "").toString().trim();
    const from = (body.from || body.sender || "").toString();
    const receivedAt = body.received_at ? new Date(body.received_at) : new Date();

    if (!raw) {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseSms(raw, from);
    const status = parsed.amount && parsed.senderNumber && parsed.provider ? "unmatched" : "invalid";

    // Duplicate check by txn_id
    if (parsed.txnId) {
      const { data: dup } = await supabase
        .from("sms_inbox")
        .select("id")
        .eq("txn_id", parsed.txnId)
        .maybeSingle();
      if (dup) {
        await supabase.from("sms_inbox").insert({
          raw_message: raw,
          sender_address: from || null,
          provider: parsed.provider,
          amount: parsed.amount,
          txn_id: parsed.txnId,
          sender_number: parsed.senderNumber,
          received_at: receivedAt.toISOString(),
          status: "duplicate",
        });
        return new Response(JSON.stringify({ matched: false, reason: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert SMS first so we always have a record
    const { data: inserted, error: insertErr } = await supabase
      .from("sms_inbox")
      .insert({
        raw_message: raw,
        sender_address: from || null,
        provider: parsed.provider,
        amount: parsed.amount,
        txn_id: parsed.txnId,
        sender_number: parsed.senderNumber,
        received_at: receivedAt.toISOString(),
        status,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    if (status === "invalid") {
      return new Response(JSON.stringify({ matched: false, reason: "parse_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match priority 1: explicit transaction ID submitted by the customer
    let match: any = null;
    if (parsed.txnId) {
      const { data: byTxn } = await supabase
        .from("orders")
        .select("id, payment_expected_amount, advance_amount, total")
        .eq("payment_txn_id", parsed.txnId)
        .is("payment_verified_at", null)
        .limit(1)
        .maybeSingle();
      if (byTxn) match = byTxn;
    }

    // Match priority 2: provider + sender + amount (±1৳) within last 24h
    if (!match) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: candidates } = await supabase
        .from("orders")
        .select("id, payment_expected_amount, payment_sender_number, payment_provider, advance_amount, total, status")
        .eq("payment_provider", parsed.provider)
        .eq("payment_sender_number", parsed.senderNumber)
        .is("payment_verified_at", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);

      match = (candidates || []).find((o: any) => {
        const expected = Number(o.payment_expected_amount || 0);
        return Math.abs(expected - (parsed.amount || 0)) <= 1;
      });
    }

    if (!match) {
      return new Response(JSON.stringify({ matched: false, sms_id: inserted.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdvance = Number(match.advance_amount || 0) > 0 && Number(match.advance_amount) < Number(match.total);
    const updates: Record<string, unknown> = {
      payment_txn_id: parsed.txnId,
      payment_verified_at: new Date().toISOString(),
    };
    if (isAdvance) updates.advance_paid = true;

    await supabase.from("orders").update(updates).eq("id", match.id);
    await supabase
      .from("sms_inbox")
      .update({
        status: "matched",
        matched_order_id: match.id,
        matched_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);

    return new Response(
      JSON.stringify({ matched: true, order_id: match.id, sms_id: inserted.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sms-webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
