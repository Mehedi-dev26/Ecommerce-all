import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PATHAO_BASE_URL = "https://api-hermes.pathao.com";

let cachedToken: { access_token: string; expires_at: number } | null = null;
let cachedCreds: PathaoCreds | null = null;
let cachedCredsAt = 0;

interface PathaoCreds {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  base_url: string;
  store_id?: number;
}

async function loadPathaoCreds(supabase: ReturnType<typeof createClient>): Promise<PathaoCreds> {
  // 60s in-memory cache to avoid repeated DB hits per cold start
  if (cachedCreds && Date.now() - cachedCredsAt < 60_000) return cachedCreds;

  let dbCreds: Record<string, unknown> = {};
  try {
    const { data } = await supabase
      .from("courier_providers")
      .select("credentials,is_active")
      .eq("provider_key", "pathao")
      .maybeSingle();
    if (data?.credentials && typeof data.credentials === "object") {
      dbCreds = data.credentials as Record<string, unknown>;
    }
  } catch (e) {
    console.warn("Could not load Pathao creds from DB, falling back to env:", e);
  }

  const creds: PathaoCreds = {
    client_id: String(dbCreds.client_id || Deno.env.get("PATHAO_CLIENT_ID") || ""),
    client_secret: String(dbCreds.client_secret || Deno.env.get("PATHAO_CLIENT_SECRET") || ""),
    username: String(dbCreds.username || Deno.env.get("PATHAO_CLIENT_EMAIL") || ""),
    password: String(dbCreds.password || Deno.env.get("PATHAO_CLIENT_PASSWORD") || ""),
    base_url: String(dbCreds.base_url || DEFAULT_PATHAO_BASE_URL),
    store_id: dbCreds.store_id ? Number(dbCreds.store_id) : undefined,
  };

  if (!creds.client_id || !creds.client_secret || !creds.username || !creds.password) {
    throw new Error("Pathao credentials missing — configure them in Admin > Courier API.");
  }

  cachedCreds = creds;
  cachedCredsAt = Date.now();
  // Reset auth token if creds changed
  cachedToken = null;
  return creds;
}

async function getPathaoToken(creds: PathaoCreds): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${creds.base_url}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      username: creds.username,
      password: creds.password,
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

async function pathaoFetch(creds: PathaoCreds, path: string, options: RequestInit = {}) {
  const token = await getPathaoToken(creds);
  const res = await fetch(`${creds.base_url}${path}`, {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const creds = await loadPathaoCreds(supabase);

    switch (action) {
      case "verify-credentials": {
        const data = await pathaoFetch(creds, "/aladdin/api/v1/stores");
        return jsonResponse({ ok: true, stores: data?.data?.data?.length || 0 });
      }

      case "get-stores": {
        const data = await pathaoFetch(creds, "/aladdin/api/v1/stores");
        return jsonResponse(data);
      }

      case "get-cities": {
        const data = await pathaoFetch(creds, "/aladdin/api/v1/city-list");
        return jsonResponse(data);
      }

      case "get-zones": {
        const cityId = url.searchParams.get("city_id");
        if (!cityId) return errorResponse("city_id required", 400);
        const data = await pathaoFetch(creds, `/aladdin/api/v1/cities/${cityId}/zone-list`);
        return jsonResponse(data);
      }

      case "get-areas": {
        const zoneId = url.searchParams.get("zone_id");
        if (!zoneId) return errorResponse("zone_id required", 400);
        const data = await pathaoFetch(creds, `/aladdin/api/v1/zones/${zoneId}/area-list`);
        return jsonResponse(data);
      }

      case "price-calc": {
        const body = await req.json();
        const data = await pathaoFetch(creds, "/aladdin/api/v1/merchant/price-plan", {
          method: "POST",
          body: JSON.stringify(body),
        });
        return jsonResponse(data);
      }

      case "create-order": {
        const body = await req.json();
        const { order_id, ...pathaoPayload } = body;

        if (!order_id) return errorResponse("order_id required", 400);

        // Auto-fetch store_id if not valid
        if (!pathaoPayload.store_id || pathaoPayload.store_id <= 1) {
          if (creds.store_id) {
            pathaoPayload.store_id = creds.store_id;
          } else {
          const storesData = await pathaoFetch(creds, "/aladdin/api/v1/stores");
          const stores = storesData?.data?.data || storesData?.data || [];
          if (Array.isArray(stores) && stores.length > 0) {
            pathaoPayload.store_id = stores[0].store_id;
          } else {
            return errorResponse("No Pathao stores found. Please create a store in Pathao merchant panel.", 400);
          }
          }
        }

        const data = await pathaoFetch(creds, "/aladdin/api/v1/orders", {
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
              courier_provider: "pathao",
              courier_tracking_id: String(consignmentId),
            })
            .eq("id", order_id);
        }

        return jsonResponse(data);
      }

      case "track-order": {
        const consignmentId = url.searchParams.get("consignment_id");
        if (!consignmentId) return errorResponse("consignment_id required", 400);

        const data = await pathaoFetch(creds, `/aladdin/api/v1/orders/${consignmentId}`);

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
        return errorResponse("Invalid action. Use: verify-credentials, get-stores, get-cities, get-zones, get-areas, price-calc, create-order, track-order", 400);
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
