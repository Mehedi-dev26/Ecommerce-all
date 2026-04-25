// Admin AI Assistant — Secure tool-calling agent for admin panel only
// Security: requires valid JWT + admin role (double-checked server-side via has_role).
// All DB writes performed with service role AFTER verification, bypassing client RLS issues
// but never executing requests from non-admin users.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Msg {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// === TOOL DEFINITIONS — what the AI can do ===
const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search/list products in the catalog by name or filter. Use this BEFORE update/delete to find the right product id.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text (matches name or name_bn). Empty for all." },
          limit: { type: "number", description: "Max results, default 10" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List all product categories with their ids.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Create a new product. ALWAYS confirm details with the user before calling. Image will be auto-generated if no image_url given.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          name_bn: { type: "string", description: "Bengali name" },
          price: { type: "number" },
          compare_price: { type: "number", description: "Optional original price for discount display" },
          stock: { type: "number" },
          category_id: { type: "string", description: "UUID from list_categories" },
          description: { type: "string" },
          description_bn: { type: "string" },
          is_featured: { type: "boolean" },
          is_active: { type: "boolean" },
          image_url: { type: "string", description: "Optional. If empty, AI will generate one." },
          generate_image: { type: "boolean", description: "Set true to auto-generate product image with AI" },
          image_prompt: { type: "string", description: "Prompt for AI image generation if generate_image=true" },
        },
        required: ["name", "name_bn", "price", "stock"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product",
      description: "Update an existing product. Provide product_id and only the fields to change.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          name: { type: "string" },
          name_bn: { type: "string" },
          price: { type: "number" },
          compare_price: { type: "number" },
          stock: { type: "number" },
          description: { type: "string" },
          description_bn: { type: "string" },
          is_featured: { type: "boolean" },
          is_active: { type: "boolean" },
          category_id: { type: "string" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_product",
      description: "Delete a product permanently. CONFIRM with user before calling.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "List recent orders with optional status filter.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Change an order's status. CONFIRM with user before calling.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "UUID or order_number like SM-0001" },
          status: { type: "string", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] },
        },
        required: ["order_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_reviews",
      description: "List customer reviews awaiting moderation.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "moderate_review",
      description: "Approve, reject, or delete a customer review.",
      parameters: {
        type: "object",
        properties: {
          review_id: { type: "string" },
          action: { type: "string", enum: ["approve", "reject", "delete"] },
        },
        required: ["review_id", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_product_image",
      description: "Generate a realistic product image with AI. Returns the image data URL — caller can attach it to a product.",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string", description: "Detailed image description" } },
        required: ["prompt"],
      },
    },
  },
];

// === TOOL EXECUTORS ===
async function execTool(name: string, args: any, supabase: any) {
  try {
    switch (name) {
      case "search_products": {
        let q = supabase
          .from("products")
          .select("id, name, name_bn, price, stock, is_active, is_featured, category_id")
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.query) q = q.or(`name.ilike.%${args.query}%,name_bn.ilike.%${args.query}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { ok: true, products: data };
      }
      case "list_categories": {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, name_bn")
          .order("sort_order");
        if (error) throw error;
        return { ok: true, categories: data };
      }
      case "create_product": {
        let imageUrl = args.image_url || null;
        if (!imageUrl && args.generate_image) {
          imageUrl = await generateImage(args.image_prompt || `Professional product photo of ${args.name}, white background, e-commerce style, high quality`);
        }
        const payload: any = {
          name: args.name,
          name_bn: args.name_bn,
          price: args.price,
          stock: args.stock ?? 0,
          compare_price: args.compare_price ?? null,
          description: args.description ?? null,
          description_bn: args.description_bn ?? null,
          is_featured: args.is_featured ?? false,
          is_active: args.is_active ?? true,
          category_id: args.category_id ?? null,
          image_url: imageUrl,
        };
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        return { ok: true, product: data, message: `Product "${data.name_bn}" created.` };
      }
      case "update_product": {
        const { product_id, ...updates } = args;
        const { data, error } = await supabase
          .from("products")
          .update(updates)
          .eq("id", product_id)
          .select()
          .single();
        if (error) throw error;
        return { ok: true, product: data, message: `Product updated.` };
      }
      case "delete_product": {
        const { error } = await supabase.from("products").delete().eq("id", args.product_id);
        if (error) throw error;
        return { ok: true, message: "Product deleted." };
      }
      case "list_orders": {
        let q = supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, total, status, created_at")
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw error;
        return { ok: true, orders: data };
      }
      case "update_order_status": {
        const isUuid = /^[0-9a-f-]{36}$/i.test(args.order_id);
        const filter = isUuid ? { id: args.order_id } : { order_number: args.order_id };
        const { data, error } = await supabase
          .from("orders")
          .update({ status: args.status })
          .match(filter)
          .select()
          .single();
        if (error) throw error;
        return { ok: true, order: data, message: `Order ${data.order_number} → ${args.status}` };
      }
      case "list_pending_reviews": {
        const { data, error } = await supabase
          .from("customer_reviews")
          .select("id, customer_name, rating, review_text, location, created_at, status")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);
        if (error) throw error;
        return { ok: true, reviews: data };
      }
      case "moderate_review": {
        if (args.action === "delete") {
          const { error } = await supabase.from("customer_reviews").delete().eq("id", args.review_id);
          if (error) throw error;
          return { ok: true, message: "Review deleted." };
        }
        const update =
          args.action === "approve"
            ? { status: "approved", is_active: true }
            : { status: "rejected", is_active: false };
        const { error } = await supabase.from("customer_reviews").update(update).eq("id", args.review_id);
        if (error) throw error;
        return { ok: true, message: `Review ${args.action}d.` };
      }
      case "generate_product_image": {
        const url = await generateImage(args.prompt);
        return { ok: true, image_url: url };
      }
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function generateImage(prompt: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!r.ok) throw new Error(`Image gen failed: ${r.status}`);
  const data = await r.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url;
}

// === MAIN HANDLER ===
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Auth check — JWT required
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify user identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !userData?.user?.id) {
      return json({ error: "Invalid session" }, 401);
    }
    const userId = userData.user.id;

    // 3. Service-role client to verify admin role (bypasses RLS recursion)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return json({ error: "Forbidden — admin only" }, 403);
    }

    // 4. Parse body
    const body = await req.json();
    const messages: Msg[] = body.messages || [];
    const confirmedToolCall = body.confirmedToolCall; // { id, name, arguments }

    // === If frontend confirmed a write action, execute it directly ===
    if (confirmedToolCall) {
      const result = await execTool(
        confirmedToolCall.name,
        typeof confirmedToolCall.arguments === "string"
          ? JSON.parse(confirmedToolCall.arguments)
          : confirmedToolCall.arguments,
        adminClient,
      );
      return json({ tool_result: result, tool_name: confirmedToolCall.name });
    }

    // 5. Build system prompt
    const systemPrompt = `You are **Surzo Admin AI** — the in-panel assistant for the store admin.

# YOUR ROLE
You help the admin manage the Surzo Shop e-commerce store via natural conversation. You have direct database access through tools.

# LANGUAGE
- Default to Bengali. Mirror the admin's language (Bangla / English / Banglish).
- Be concise, professional, friendly. Use bullet points for lists.

# CAPABILITIES (via tools)
- Search/create/update/delete products
- View and update order status
- Approve/reject customer reviews
- Generate AI product images
- List categories

# CRITICAL RULES
1. **Always search/list FIRST** before update/delete — you need real IDs.
2. **For destructive or write actions** (create_product, update_product, delete_product, update_order_status, moderate_review): briefly summarize what you'll do, then call the tool. The frontend will show a confirm chip to the admin — do NOT ask "should I proceed?" in text, just call the tool with clear arguments.
3. For **create_product**: if the admin doesn't provide an image, set generate_image=true and write a detailed image_prompt.
4. For market research: the admin will share specs/prices manually — you do NOT have web search. Politely ask for any missing info.
5. After a tool runs, summarize the result naturally (don't dump JSON).
6. Never invent product IDs, order numbers, or prices. Always fetch real data first.
7. Bengali product names are required (name_bn). If admin gives only English, translate it.

# WORKFLOW EXAMPLES
- "Sony headphone add koro 2500 takay" → list_categories → create_product (with generate_image=true)
- "Order SM-0042 confirmed koro" → update_order_status
- "Pending review koyta?" → list_pending_reviews → summarize
- "Eta approve koro" → moderate_review

Be proactive but precise. Always confirm critical numbers (price, stock) verbally before calling tools.`;

    // 6. Call Lovable AI Gateway with tools
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "অনেক request হয়েছে, একটু পরে চেষ্টা করুন।" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits শেষ। Workspace Settings → Usage এ গিয়ে credit add করুন।" }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiData = await aiResp.json();
    const choice = aiData?.choices?.[0];
    const message = choice?.message;
    const toolCalls = message?.tool_calls;

    // 7. If AI wants to call tools
    if (toolCalls && toolCalls.length > 0) {
      const writeTools = new Set([
        "create_product",
        "update_product",
        "delete_product",
        "update_order_status",
        "moderate_review",
      ]);

      // Auto-execute READ tools, return WRITE tools for confirmation
      const autoResults: any[] = [];
      const pendingConfirmations: any[] = [];

      for (const tc of toolCalls) {
        if (writeTools.has(tc.function.name)) {
          pendingConfirmations.push({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          });
        } else {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await execTool(tc.function.name, args, adminClient);
          autoResults.push({
            tool_call_id: tc.id,
            name: tc.function.name,
            result,
          });
        }
      }

      // If only confirmations needed, return them now
      if (pendingConfirmations.length > 0 && autoResults.length === 0) {
        return json({
          assistant_message: message.content || "নিচের action-গুলো confirm করুন:",
          pending_confirmations: pendingConfirmations,
        });
      }

      // If read tools ran, send results back to AI for final response
      const followupMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        {
          role: "assistant",
          content: message.content,
          tool_calls: toolCalls,
        },
        ...autoResults.map((r) => ({
          role: "tool" as const,
          tool_call_id: r.tool_call_id,
          name: r.name,
          content: JSON.stringify(r.result),
        })),
      ];

      const followup = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: followupMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      const followData = await followup.json();
      const followMsg = followData?.choices?.[0]?.message;

      // If the followup also produced write tool calls, surface them as pending
      const followToolCalls = followMsg?.tool_calls;
      if (followToolCalls && followToolCalls.length > 0) {
        const morePending = followToolCalls
          .filter((tc: any) => writeTools.has(tc.function.name))
          .map((tc: any) => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }));
        if (morePending.length > 0) {
          return json({
            assistant_message: followMsg.content || "নিচের action-গুলো confirm করুন:",
            pending_confirmations: morePending,
          });
        }
      }

      return json({
        assistant_message: followMsg?.content || "Done.",
        pending_confirmations: pendingConfirmations.length > 0 ? pendingConfirmations : undefined,
      });
    }

    // 8. No tool calls — pure text response
    return json({ assistant_message: message?.content || "" });
  } catch (e) {
    console.error("admin-ai-assistant error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
