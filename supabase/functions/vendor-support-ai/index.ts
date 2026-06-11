// Vendor live support — AI suggested replies for the admin
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Msg { role: "vendor" | "admin" | "system"; body: string; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { messages, vendorName } = (await req.json()) as { messages: Msg[]; vendorName?: string };

    const convo = (messages || [])
      .slice(-12)
      .map((m) => `${m.role === "vendor" ? "ভেন্ডর" : m.role === "admin" ? "অ্যাডমিন" : "System"}: ${m.body}`)
      .join("\n");

    const systemPrompt = `You are an assistant helping a Sapahar Shop admin reply to a vendor (${vendorName || "vendor"}) in a live support chat.

Read the conversation and produce **4 short, polite, professional reply suggestions in Bangla** that the admin could send next.

Rules:
- Each suggestion: 1-2 short sentences, warm and humanized tone.
- Cover different intents when possible: acknowledge, ask for clarification, provide a concrete answer/next-step, reassure.
- Address the vendor respectfully (ভাই/আপু/আপনি).
- Never invent facts; if data is missing, ask politely.
- Return ONLY a JSON array of 4 strings — no markdown, no commentary.

Example output:
["জি ভাই, আপনার সমস্যাটি বুঝেছি। একটু পরীক্ষা করে জানাচ্ছি।", "...", "...", "..."]`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation so far:\n${convo}\n\nGenerate 4 reply suggestions as a JSON array.` },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const text: string = data.choices?.[0]?.message?.content || "[]";
    let suggestions: string[] = [];
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      suggestions = JSON.parse(match ? match[0] : cleaned);
    } catch {
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions: suggestions.slice(0, 4) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vendor-support-ai", e);
    return new Response(JSON.stringify({ suggestions: [], error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
