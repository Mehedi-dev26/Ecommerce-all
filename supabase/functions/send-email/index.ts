import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

interface Recipient {
  email: string;
  name?: string;
  variables?: Record<string, string | number>;
  relatedOrderId?: string | null;
  relatedUserId?: string | null;
}

interface SendEmailRequest {
  templateKey?: string;
  subject?: string;
  htmlBody?: string;
  variables?: Record<string, string | number>;
  recipients: Recipient[];
  sentBy?: string | null;
  relatedOrderId?: string | null;
  relatedUserId?: string | null;
}

function base64UrlEncode(str: string): string {
  // Encode UTF-8 properly for Bengali characters
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function injectVariables(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    out = out.replace(re, String(value ?? ""));
  }
  // Replace any leftover {{var}} with empty string to keep emails clean
  out = out.replace(/\{\{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\}\}/g, "");
  return out;
}

function buildRawEmail(opts: {
  to: string;
  toName?: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  htmlBody: string;
}): string {
  const toHeader = opts.toName ? `${opts.toName} <${opts.to}>` : opts.to;
  const fromHeader = `${opts.fromName} <${opts.fromEmail}>`;
  // Encode subject with RFC 2047 to safely transport Unicode (Bengali)
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(opts.subject)))}?=`;
  const lines = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(opts.htmlBody))),
  ];
  return base64UrlEncode(lines.join("\r\n"));
}

async function gmailSend(raw: string, lovableKey: string, gmailKey: string) {
  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gmailKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(
      `Gmail send failed [${res.status}]: ${json?.error?.message || text || "Unknown error"}`,
    );
  }
  return json;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!GOOGLE_MAIL_API_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_MAIL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: SendEmailRequest = await req.json();
    if (!body.recipients?.length) {
      return new Response(JSON.stringify({ error: "No recipients provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Resolve template
    let templateSubject = body.subject || "";
    let templateHtml = body.htmlBody || "";
    if (body.templateKey) {
      const { data: tpl, error: tplErr } = await supabase
        .from("email_templates")
        .select("subject, html_body, is_active")
        .eq("template_key", body.templateKey)
        .maybeSingle();
      if (tplErr) throw tplErr;
      if (!tpl) throw new Error(`Template "${body.templateKey}" not found`);
      if (!tpl.is_active) throw new Error(`Template "${body.templateKey}" is inactive`);
      templateSubject = tpl.subject;
      templateHtml = tpl.html_body;
    }
    if (!templateSubject || !templateHtml) {
      return new Response(JSON.stringify({ error: "subject and htmlBody required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch sender branding from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["company_name", "company_email", "footer_email", "footer_phone", "footer_location"]);
    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => (settingsMap[s.key] = s.value));
    const companyName = settingsMap.company_name || "Sapahar Shop";
    const companyEmail = settingsMap.company_email || settingsMap.footer_email || "info@example.com";

    const baseVars = {
      site_name: companyName,
      company_name: companyName,
      company_email: companyEmail,
      site_url: new URL(SUPABASE_URL).hostname.replace(".supabase.co", ".lovable.app"),
      ...(body.variables || {}),
    };

    const results: Array<{ email: string; status: string; messageId?: string; error?: string }> = [];

    for (let i = 0; i < body.recipients.length; i++) {
      const r = body.recipients[i];
      const mergedVars = {
        ...baseVars,
        ...(r.variables || {}),
        customer_name: r.variables?.customer_name || r.name || "গ্রাহক",
      };
      const subject = injectVariables(templateSubject, mergedVars);
      const html = injectVariables(templateHtml, mergedVars);

      let status = "sent";
      let errorMessage: string | null = null;
      let messageId: string | null = null;

      try {
        const raw = buildRawEmail({
          to: r.email,
          toName: r.name,
          fromEmail: companyEmail,
          fromName: companyName,
          subject,
          htmlBody: html,
        });
        const result = await gmailSend(raw, LOVABLE_API_KEY, GOOGLE_MAIL_API_KEY);
        messageId = result?.id || null;
        results.push({ email: r.email, status, messageId: messageId || undefined });
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
        results.push({ email: r.email, status, error: errorMessage });
      }

      // Log every attempt
      await supabase.from("email_logs").insert({
        recipient_email: r.email,
        recipient_name: r.name || null,
        subject,
        body: html,
        template_key: body.templateKey || null,
        status,
        error_message: errorMessage,
        gmail_message_id: messageId,
        related_order_id: r.relatedOrderId || body.relatedOrderId || null,
        related_user_id: r.relatedUserId || body.relatedUserId || null,
        sent_by: body.sentBy || null,
        metadata: { variables: mergedVars },
      });

      // 250ms throttle between sends (skip after last)
      if (i < body.recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.length - sentCount;

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-email error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
