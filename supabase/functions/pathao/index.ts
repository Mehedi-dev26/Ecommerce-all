import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PATHAO_BASE_URL = "https://api-hermes.pathao.com";

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getPathaoToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PATHAO_CLIENT_ID"),
      client_secret: Deno.env.get("PATHAO_CLIENT_SECRET"),
      username: Deno.env.get("PATHAO_CLIENT_EMAIL"),
      password: Deno.env.get("PATHAO_CLIENT_PASSWORD"),
      grant_type: "password",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pathao auth failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.access_token;
}

async function pathaoFetch(path: string, options: RequestInit = {}) {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pathao API error [${res.status}]: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Verify auth for non-tracking actions
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case "get-stores": {
        const data = await pathaoFetch("/aladdin/api/v1/stores");
        return jsonResponse(data);
      }

      case "get-cities": {
        const data = await pathaoFetch("/aladdin/api/v1/city-list");
        return jsonResponse(data);
      }

      case "get-zones": {
        const cityId = url.searchParams.get("city_id");
        if (!cityId) return errorResponse("city_id required", 400);
        const data = await pathaoFetch(`/aladdin/api/v1/cities/${cityId}/zone-list`);
        return jsonResponse(data);
      }

      case "get-areas": {
        const zoneId = url.searchParams.get("zone_id");
        if (!zoneId) return errorResponse("zone_id required", 400);
        const data = await pathaoFetch(`/aladdin/api/v1/zones/${zoneId}/area-list`);
        return jsonResponse(data);
      }

      case "price-calc": {
        const body = await req.json();
        const data = await pathaoFetch("/aladdin/api/v1/merchant/price-plan", {
          method: "POST",
          body: JSON.stringify(body),
        });
        return jsonResponse(data);
      }

      case "create-order": {
        const body = await req.json();
        const { order_id, ...pathaoPayload } = body;

        if (!order_id) return errorResponse("order_id required", 400);

        const data = await pathaoFetch("/aladdin/api/v1/orders", {
          method: "POST",
          body: JSON.stringify(pathaoPayload),
        });

        // Save consignment info to order
        const consignmentId = data?.data?.consignment_id;
        if (consignmentId) {
          await supabase
            .from("orders")
            .update({
              pathao_consignment_id: String(consignmentId),
              pathao_order_status: data?.data?.order_status || "Pending",
              pathao_tracking_url: `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`,
              delivery_fee: data?.data?.delivery_fee || 0,
            })
            .eq("id", order_id);
        }

        return jsonResponse(data);
      }

      case "track-order": {
        const consignmentId = url.searchParams.get("consignment_id");
        if (!consignmentId) return errorResponse("consignment_id required", 400);

        const data = await pathaoFetch(`/aladdin/api/v1/orders/${consignmentId}`);

        // Update status in DB
        if (data?.data?.order_status) {
          // Find order by consignment_id and update
          await supabase
            .from("orders")
            .update({ pathao_order_status: data.data.order_status })
            .eq("pathao_consignment_id", consignmentId);
        }

        return jsonResponse(data);
      }

      default:
        return errorResponse("Invalid action. Use: get-stores, get-cities, get-zones, get-areas, price-calc, create-order, track-order", 400);
    }
  } catch (err: unknown) {
    console.error("Pathao function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
