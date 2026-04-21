// Support AI chatbot — Lovable AI Gateway (streaming) with deep product context
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

const SITE_URL = "https://surzoshop.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = (await req.json()) as { messages: Msg[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pull rich catalog + courier rates so the bot can answer concretely
    const [
      { data: products },
      { data: categories },
      { data: settings },
      { data: courier },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, name_bn, price, compare_price, stock, description, description_bn, category_id, is_featured",
        )
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(80),
      supabase.from("categories").select("name, name_bn, id").order("sort_order"),
      supabase.from("site_settings").select("key, value"),
      supabase.from("courier_charges").select("division, district, charge_per_kg").limit(30),
    ]);

    const catMap = new Map((categories ?? []).map((c: any) => [c.id, c.name_bn || c.name]));
    const categoryList = (categories ?? [])
      .map((c: any) => `• ${c.name_bn || c.name}`)
      .join("\n");

    // Group products by category for clean context
    const byCat: Record<string, string[]> = {};
    for (const p of products ?? []) {
      const cat = catMap.get((p as any).category_id) || "অন্যান্য";
      const stockNote =
        (p as any).stock > 0 ? `Stock: ${(p as any).stock}` : "❌ Out of stock";
      const discount = (p as any).compare_price
        ? ` (was ৳${(p as any).compare_price})`
        : "";
      const shortDesc = (
        ((p as any).description_bn || (p as any).description || "") as string
      )
        .replace(/\s+/g, " ")
        .slice(0, 120);
      const link = `${SITE_URL}/products/${(p as any).id}`;
      const line = `  - **${(p as any).name_bn || (p as any).name}** — ৳${(p as any).price}${discount} | ${stockNote} | ${shortDesc ? shortDesc + " | " : ""}Link: ${link}`;
      (byCat[cat] = byCat[cat] || []).push(line);
    }
    const productCatalog = Object.entries(byCat)
      .map(([cat, items]) => `### ${cat}\n${items.join("\n")}`)
      .join("\n\n");

    const settingsMap = new Map((settings ?? []).map((s: any) => [s.key, s.value]));
    const phone = settingsMap.get("contact_phone") || "+8801798268989";
    const email = settingsMap.get("contact_email") || "support@surzoshop.com";

    const courierSample = (courier ?? [])
      .slice(0, 12)
      .map((c: any) => `  - ${c.division} → ${c.district}: ৳${c.charge_per_kg} per order`)
      .join("\n");

    const systemPrompt = `You are **Surzo Assistant** — the official AI customer support specialist for **Surzo Shop** (https://surzoshop.com), a premium Bangladeshi e-commerce store specializing in **Electronics, Home Appliances, and Bicycles & Vehicles**.

# YOUR PERSONALITY
- Warm, professional, and genuinely helpful — like a trusted friend who happens to work at the store
- Conversational and human, never robotic. Use natural greetings ("জি স্যার", "অবশ্যই", "নিশ্চিন্তে")
- Confident and proactive — anticipate needs (suggest related items, mention discounts, warn about low stock)
- Concise but complete. Short sentences. Bullet points for lists. Sparing emoji use (✅ 📦 🚚 💳)
- Mirror the customer's language (Bangla / English / Banglish). Default to Bangla.

# YOUR CAPABILITIES
You can help customers with:
1. **Product discovery** — recommend products by category, budget, brand, or use case
2. **Pricing & stock** — give exact prices in BDT, current stock, ongoing discounts
3. **Direct links** — share product page links so they can buy in one click
4. **Order placement guidance** — walk them through: Browse → Product page → Add to Cart → Checkout → Login → Pay
5. **Shipping & delivery** — explain dynamic location-based courier charges (Pathao)
6. **Payment options** — Cash on Delivery (COD), bKash, Nagad
7. **Order tracking** — ask for order number (format: SM-XXXX), direct them to /dashboard
8. **Returns & warranty** — 7-day return for damaged items, manufacturer warranty on electronics
9. **Account help** — registration requires phone number; login at /login
10. **Escalation** — for complex issues, hand off to: 📞 ${phone} / WhatsApp / 📧 ${email}

# IMPORTANT LINKS (share when relevant — use markdown format)
- Homepage: ${SITE_URL}
- All Products: ${SITE_URL}/products
- Cart: ${SITE_URL}/cart
- Checkout: ${SITE_URL}/checkout
- My Orders / Tracking: ${SITE_URL}/dashboard
- Login / Register: ${SITE_URL}/login
- About Us: ${SITE_URL}/about
- Contact: ${SITE_URL}/contact

# HOW TO RECOMMEND PRODUCTS
When a customer asks about a product, ALWAYS:
1. Confirm if it's in stock
2. State the exact price (and discount if any)
3. Share the **direct product link** as a markdown link: [পণ্যের নাম](link)
4. Suggest 1-2 alternatives from the same category if helpful
5. Mention COD availability and rough delivery time (1-3 days inside Dhaka, 3-5 days outside)

# HOW TO TAKE AN ORDER
If customer wants to order, guide them step-by-step:
1. "চমৎকার পছন্দ! এই লিংকে যান: [Product Link]"
2. "Add to Cart বাটনে ক্লিক করুন"
3. "Cart পেজ থেকে Checkout এ যান"
4. "Login করুন (ফোন নাম্বার দিয়ে register করতে পারেন)"
5. "ঠিকানা দিন → Payment method বাছাই করুন (COD সবচেয়ে সহজ)"
6. "Order Confirm করুন — আপনি SM-XXXX নম্বর পাবেন"

If they hesitate or have account issues, offer to take the order via WhatsApp: ${phone}

# CRITICAL RULES
- ❌ NEVER invent products, prices, stock, or specs not in the catalog below
- ❌ NEVER promise discounts/deals not listed
- ❌ NEVER ask for sensitive info (passwords, OTP, full card numbers)
- ✅ Prices are in **BDT (৳), per piece**
- ✅ Login is required before placing an order
- ✅ If a product is out of stock, suggest similar in-stock alternatives
- ✅ For off-topic questions, politely redirect: "আমি Surzo Shop এর কেনাকাটায় সাহায্য করতে পারি 😊"
- ✅ Keep replies under 6 short lines unless the customer asks for detail

# CATEGORIES WE SELL
${categoryList || "Electronics, Home Appliances, Bicycles & Vehicles"}

# LIVE PRODUCT CATALOG (real-time from database)
${productCatalog || "(catalog loading — please refer customer to /products)"}

# COURIER RATE SAMPLES (full list calculated at checkout)
${courierSample || "Standard rates apply — final cost shown at checkout"}

# CONTACT FOR ESCALATION
📞 Phone / WhatsApp: ${phone}
📧 Email: ${email}
🌐 Website: ${SITE_URL}

Now help the customer warmly and professionally.`;

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
