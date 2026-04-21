// Support AI chatbot — uses Lovable AI Gateway (streaming) with product context
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = (await req.json()) as { messages: Msg[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Pull a small product + category snapshot so the bot can answer about the catalog
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: products }, { data: categories }, { data: settings }] = await Promise.all([
      supabase
        .from("products")
        .select("name, name_bn, price, compare_price, stock, description_bn, category_id")
        .eq("is_active", true)
        .limit(40),
      supabase.from("categories").select("name, name_bn, id"),
      supabase.from("site_settings").select("key, value"),
    ]);

    const catMap = new Map((categories ?? []).map((c: any) => [c.id, c.name_bn || c.name]));
    const productList = (products ?? [])
      .map(
        (p: any) =>
          `- ${p.name_bn || p.name} (${catMap.get(p.category_id) || "—"}): ৳${p.price}${
            p.compare_price ? ` (regular ৳${p.compare_price})` : ""
          }, stock: ${p.stock}`,
      )
      .join("\n");

    const settingsMap = new Map((settings ?? []).map((s: any) => [s.key, s.value]));
    const phone = settingsMap.get("contact_phone") || "+8801798268989";
    const email = settingsMap.get("contact_email") || "support@surzoshop.com";

    const systemPrompt = `You are "Surzo Assistant" — the friendly AI customer support agent for **Surzo Shop**, a Bangladeshi e-commerce store selling Electronics, Home Appliances, and Bicycles & Vehicles.

LANGUAGE: Reply in the same language the customer uses. Default to Bengali (Bangla) if unsure. Be warm, concise, and professional.

YOUR JOBS:
1. Answer product questions (price, stock, specs, comparison) using the catalog below.
2. Help customers place orders — guide them to the product page → Add to Cart → Checkout.
3. Explain shipping (dynamic by Division/District/Upazila), payment (Cash on Delivery, bKash, Nagad), returns, and warranty.
4. Help with order status — ask for the order number (format: SM-XXXX) and direct them to /dashboard.
5. For complex issues, give the contact: ${phone} (also WhatsApp) / ${email}.

RULES:
- Never invent products, prices, or stock that aren't in the catalog.
- Prices are in BDT (৳), per piece.
- Login is required before checkout.
- Keep replies short — use bullet points and emojis sparingly (✅ 📦 🚚).
- If asked something off-topic, politely steer back to shopping.

CATALOG SNAPSHOT (top items):
${productList || "(catalog loading)"}

CONTACT: WhatsApp/Phone ${phone} • Email ${email}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "অনেক বেশি অনুরোধ এসেছে, একটু পরে আবার চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits শেষ — Workspace Settings এ গিয়ে credit add করুন।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
