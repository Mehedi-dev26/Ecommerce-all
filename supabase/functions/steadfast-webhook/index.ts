import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Map Steadfast status -> internal order status
function mapInternalStatus(steadfastStatus: string): string | null {
  const s = (steadfastStatus || "").toLowerCase();
  if (["delivered", "partial_delivered"].includes(s)) return "delivered";
  if (["cancelled", "delivered_cancelled"].includes(s)) return "cancelled";
  if (["in_review", "pending"].includes(s)) return "processing";
  if (["hold", "unknown", "delivered_approval_pending", "partial_delivered_approval_pending", "cancelled_approval_pending", "unknown_approval_pending"].includes(s)) return "processing";
  // shipping / out for delivery / on the way etc.
  if (s.includes("delivery") || s.includes("ship") || s.includes("transit") || s.includes("hub")) return "shipped";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Accept JSON or form-encoded
    let payload: Record<string, unknown> = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json().catch(() => ({}));
    } else {
      const txt = await req.text();
      try { payload = JSON.parse(txt); } catch {
        const params = new URLSearchParams(txt);
        params.forEach((v, k) => { payload[k] = v; });
      }
    }

    console.log("Steadfast webhook payload:", JSON.stringify(payload));

    const consignmentId = String(
      payload.consignment_id ?? payload.cid ?? payload.tracking_code ?? ""
    ).trim();
    const invoice = String(payload.invoice ?? payload.merchant_order_id ?? "").trim();
    const status = String(payload.status ?? payload.delivery_status ?? "").trim();

    if (!status) {
      return new Response(JSON.stringify({ error: "status required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update: Record<string, unknown> = {
      pathao_order_status: status,
      courier_provider: "steadfast",
    };
    const internal = mapInternalStatus(status);
    if (internal) update.status = internal;

    // Try update by consignment_id first; fallback to invoice (order_number)
    let updated = 0;
    if (consignmentId) {
      const { data, error } = await supabase
        .from("orders")
        .update(update)
        .or(`courier_tracking_id.eq.${consignmentId},pathao_consignment_id.eq.${consignmentId}`)
        .select("id");
      if (error) console.error("Update by cid error:", error);
      updated = data?.length ?? 0;
    }
    if (!updated && invoice) {
      const { data, error } = await supabase
        .from("orders")
        .update(update)
        .eq("order_number", invoice)
        .select("id");
      if (error) console.error("Update by invoice error:", error);
      updated = data?.length ?? 0;
    }

    return new Response(JSON.stringify({ ok: true, updated, status, internal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Steadfast webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});