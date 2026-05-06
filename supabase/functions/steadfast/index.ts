import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE_URL = "https://portal.packzy.com/api/v1";

interface SteadfastCreds {
  api_key: string;
  secret_key: string;
  base_url: string;
}

async function loadCreds(supabase: ReturnType<typeof createClient>): Promise<SteadfastCreds> {
  const { data, error } = await supabase
    .from("courier_providers")
    .select("credentials")
    .eq("provider_key", "steadfast")
    .maybeSingle();
  if (error) throw new Error(`DB error: ${error.message}`);
  const c = (data?.credentials || {}) as Record<string, unknown>;
  const api_key = String(c.api_key || "");
  const secret_key = String(c.secret_key || "");
  if (!api_key || !secret_key) {
    throw new Error("Steadfast credentials missing — configure them in Admin > Courier API.");
  }
  return {
    api_key,
    secret_key,
    base_url: String(c.base_url || DEFAULT_BASE_URL),
  };
}

async function steadfastFetch(creds: SteadfastCreds, path: string, options: RequestInit = {}) {
  const res = await fetch(`${creds.base_url}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Api-Key": creds.api_key,
      "Secret-Key": creds.secret_key,
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Steadfast API error [${res.status}]: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data as Record<string, unknown>;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const creds = await loadCreds(supabase);

    switch (action) {
      case "verify-credentials": {
        const data = await steadfastFetch(creds, "/get_balance");
        // /get_balance succeeds even if the account is not yet activated for creating orders.
        // Probe create_order with an obviously-invalid payload — Steadfast returns:
        //   - 401 "Account is not active!" when the merchant account is disabled
        //   - 422 validation errors when the account IS active (which means creds are good)
        let accountActive = true;
        let activationMessage: string | null = null;
        try {
          await steadfastFetch(creds, "/create_order", {
            method: "POST",
            body: JSON.stringify({ invoice: "", recipient_name: "", recipient_phone: "", recipient_address: "", cod_amount: 0 }),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("Account is not active")) {
            accountActive = false;
            activationMessage = "আপনার Steadfast account এখনো active নয়। Steadfast সাপোর্টে যোগাযোগ করে account activate করান।";
          }
          // 422 validation errors are expected and mean the account is active.
        }
        return jsonResponse({ ok: accountActive, balance: data, account_active: accountActive, message: activationMessage });
      }

      case "create-order": {
        const body = await req.json();
        const { order_id, ...payload } = body;
        if (!order_id) return errorResponse("order_id required", 400);

        // Required: invoice, recipient_name, recipient_phone, recipient_address, cod_amount
        const data = await steadfastFetch(creds, "/create_order", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const consignment = (data as { consignment?: { consignment_id?: string | number; tracking_code?: string; status?: string } }).consignment;
        const cid = consignment?.consignment_id ? String(consignment.consignment_id) : null;
        const trackingCode = consignment?.tracking_code || cid;

        if (cid) {
          await supabase.from("orders").update({
            courier_provider: "steadfast",
            courier_tracking_id: cid,
            pathao_consignment_id: cid,
            pathao_order_status: consignment?.status || "in_review",
            pathao_tracking_url: trackingCode ? `https://steadfast.com.bd/t/${trackingCode}` : null,
          }).eq("id", order_id);
        }

        return jsonResponse(data);
      }

      case "track-order": {
        const cid = url.searchParams.get("consignment_id");
        if (!cid) return errorResponse("consignment_id required", 400);
        const data = await steadfastFetch(creds, `/status_by_cid/${cid}`);
        const status = (data as { delivery_status?: string }).delivery_status;
        if (status) {
          await supabase.from("orders").update({ pathao_order_status: status }).eq("courier_tracking_id", cid);
        }
        return jsonResponse(data);
      }

      default:
        return errorResponse("Invalid action. Use: verify-credentials, create-order, track-order", 400);
    }
  } catch (err: unknown) {
    console.error("Steadfast function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});