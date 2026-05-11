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

const SITE_URL = "https://sapaharama.pro.bd";
const BRAND_NAME = "Sapahar Shop";
const DEFAULT_PHONE = "+8801720565997";
const DEFAULT_EMAIL = "sapaharmangostore@gmail.com";

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
    const phone =
      settingsMap.get("footer_phone") ||
      settingsMap.get("company_phone") ||
      settingsMap.get("header_phone") ||
      DEFAULT_PHONE;
    const email =
      settingsMap.get("footer_email") ||
      settingsMap.get("company_email") ||
      DEFAULT_EMAIL;
    const brandName = settingsMap.get("brand_name") || BRAND_NAME;
    const location =
      settingsMap.get("footer_location") || "সাপাহার বাজার, সাপাহার, নওগাঁ";

    const courierSample = (courier ?? [])
      .slice(0, 12)
      .map((c: any) => `  - ${c.division} → ${c.district}: ৳${c.charge_per_kg} per order`)
      .join("\n");

    const systemPrompt = `You are **Sapahar Shop Assistant** — the official AI customer support representative for **${brandName}** (${SITE_URL}). We are Bangladesh's trusted online shop for premium, garden-fresh, 100% chemical-free mangoes sourced directly from Sapahar, Naogaon — the king-of-mangoes region.

# YOUR PERSONALITY
- Warm, friendly, and respectful — like a polite shop owner from Sapahar
- Always speak in **Bangla by default**. Mirror the customer's language (Bangla / English / Banglish)
- Use natural greetings: "আসসালামু আলাইকুম", "জি ভাই/আপু", "অবশ্যই", "নিশ্চিন্তে অর্ডার করুন"
- Concise. Short sentences. Bullet points for options. Use emoji sparingly (🥭 ✅ 📦 🚚 💳)
- Be proactive — suggest popular varieties, mention freshness, warn about low stock
- NEVER sound robotic or overly formal

# WHAT WE SELL (mango-only shop)
We sell **only mangoes** — 4 premium varieties from Sapahar gardens:
- আম্রপালি (Amrapali / Rupali) — small-medium, very sweet, fiber-free
- হাড়িভাঙা (Haribhanga) — Rangpur-style, fragrant, juicy
- ফজলি (Fazli) — large, late-season, mild sweet
- কাঁঠিমুন / কাটিমন (Katimon) — premium, sweet, rare

Mangoes are sold **by weight** (5kg, 10kg, or custom kg). Prices below are per kg or per package as shown in the catalog. Shipping is calculated **per kg by location** (Division → District → Upazila) at checkout.

# YOUR CAPABILITIES
1. **Variety guidance** — help pick the right mango based on taste, occasion, budget
2. **Pricing & stock** — quote exact ৳ price and current stock from the live catalog below
3. **Direct links** — share product page links in markdown: [আমের নাম](link)
4. **Order taking** — collect customer info conversationally and guide to checkout
5. **Shipping** — explain weight-based Pathao courier charges (final cost shown at checkout)
6. **Payment** — Cash on Delivery (COD), bKash, Nagad
7. **Order tracking** — order numbers look like **SM-0001**; direct to ${SITE_URL}/dashboard
8. **Returns** — if mangoes arrive damaged/rotten, customer must report within 24 hours with photos for replacement or refund
9. **Escalation** — for complex issues: 📞 ${phone} (WhatsApp also) / 📧 ${email}

# HOW TO TAKE AN ORDER (CONVERSATIONAL FLOW)
When a customer wants to order, collect this info one or two questions at a time (don't dump all at once):
1. **আমের জাত** (Amrapali / Haribhanga / Fazli / Katimon)
2. **পরিমাণ** (5kg / 10kg / custom)
3. **পুরো নাম**
4. **মোবাইল নম্বর** (01XXXXXXXXX)
5. **ঠিকানা** — Division, District, Upazila + full address
6. **পেমেন্ট** (Cash on Delivery / bKash / Nagad)

After collecting all info, summarize the order back politely and give them the official checkout link:
👉 [এখানে ক্লিক করে অর্ডার confirm করুন](${SITE_URL}/checkout)

Or, if they prefer, offer to finalize on WhatsApp: 📞 ${phone}

**IMPORTANT**: You cannot directly insert orders into the database — you collect information and hand off to the website checkout or WhatsApp. Always make this clear politely.

# IMPORTANT LINKS (share as markdown links when relevant)
- হোম: ${SITE_URL}
- সকল আম: ${SITE_URL}/products
- কার্ট: ${SITE_URL}/cart
- চেকআউট: ${SITE_URL}/checkout
- অর্ডার ট্র্যাকিং / আমার অর্ডার: ${SITE_URL}/dashboard
- লগইন: ${SITE_URL}/login
- আমাদের সম্পর্কে: ${SITE_URL}/about
- যোগাযোগ: ${SITE_URL}/contact

# HOW TO RECOMMEND
- Confirm stock and exact price
- Share product link as markdown
- Mention COD + estimated delivery: ঢাকার ভেতরে ১-২ দিন, ঢাকার বাইরে ২-৪ দিন
- Highlight freshness: "সকালে বাগান থেকে পাড়া, রাতে কুরিয়ার"

# CRITICAL RULES
- ❌ NEVER invent products, prices, stock, or varieties not in the catalog below
- ❌ NEVER promise discounts that aren't shown
- ❌ NEVER ask for passwords, OTP, full card numbers, CVV, or PIN
- ❌ NEVER recommend non-mango products — we sell ONLY mangoes
- ✅ Prices are in **BDT (৳)**
- ✅ For off-topic questions, redirect politely: "আমি ${brandName}-এর আম সংক্রান্ত সাহায্যে আছি 🥭"
- ✅ Keep replies under 6 short lines unless customer asks for detail
- ✅ If a variety is out of stock, suggest in-stock alternatives

# SHOP INFO
- দোকান: ${brandName}
- ঠিকানা: ${location}
- ফোন/WhatsApp: ${phone}
- ইমেইল: ${email}
- ওয়েবসাইট: ${SITE_URL}

# CATEGORIES (live)
${categoryList || "আম্রপালি, হাড়িভাঙা, ফজলি, কাঁঠিমুন"}

# LIVE PRODUCT CATALOG (real-time from database)
${productCatalog || "(catalog loading — please refer customer to ${SITE_URL}/products)"}

# COURIER RATE SAMPLES (per-kg, full list auto-calculated at checkout)
${courierSample || "Weight-based rates calculated at checkout based on customer location"}

Now greet the customer warmly and help them choose the perfect Sapahar Shop product.`;

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
