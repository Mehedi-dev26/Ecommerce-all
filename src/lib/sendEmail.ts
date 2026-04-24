import { supabase } from "@/integrations/supabase/client";

export interface EmailRecipient {
  email: string;
  name?: string;
  variables?: Record<string, string | number>;
  relatedOrderId?: string | null;
  relatedUserId?: string | null;
}

export interface SendEmailOptions {
  /** Template key from email_templates table */
  templateKey?: string;
  /** Custom subject (used when no templateKey) */
  subject?: string;
  /** Custom HTML body (used when no templateKey) */
  htmlBody?: string;
  /** Variables applied to ALL recipients */
  variables?: Record<string, string | number>;
  /** Single or multiple recipients */
  recipients: EmailRecipient[];
  /** Admin user id who triggered the send (optional) */
  sentBy?: string | null;
  /** Related order id (optional) */
  relatedOrderId?: string | null;
  /** Related user id (optional) */
  relatedUserId?: string | null;
  /**
   * Silent mode: never throws, never blocks. Logs to console on error.
   * Use this for fire-and-forget triggers (signup, order, status change).
   */
  silent?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  error?: string;
}

/**
 * Send an email via the send-email edge function (Gmail API).
 * In silent mode, returns immediately without awaiting and never throws.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { silent, ...payload } = options;

  const invoke = async (): Promise<SendEmailResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: payload,
      });
      if (error) {
        if (!silent) console.error("[sendEmail] error:", error);
        return { success: false, sent: 0, failed: payload.recipients.length, error: error.message };
      }
      return {
        success: true,
        sent: data?.sent ?? 0,
        failed: data?.failed ?? 0,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!silent) console.error("[sendEmail] exception:", msg);
      return { success: false, sent: 0, failed: payload.recipients.length, error: msg };
    }
  };

  if (silent) {
    // Fire-and-forget — never blocks the caller, never throws
    void invoke().catch(() => {});
    return { success: true, sent: 0, failed: 0 };
  }

  return invoke();
}

/**
 * Helper: build an HTML items table for order_confirmation template
 */
export function buildOrderItemsHtml(
  items: Array<{ name: string; quantity: number; price: number }>,
): string {
  const rows = items
    .map(
      (it) => `<tr>
<td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(it.name)}</td>
<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${it.quantity}</td>
<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">৳ ${(it.price * it.quantity).toLocaleString()}</td>
</tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
<thead><tr style="background:#f1f5f9;">
<th style="padding:10px;text-align:left;font-weight:600;color:#475569;">পণ্য</th>
<th style="padding:10px;text-align:center;font-weight:600;color:#475569;">পরিমাণ</th>
<th style="padding:10px;text-align:right;font-weight:600;color:#475569;">মূল্য</th>
</tr></thead><tbody>${rows}</tbody></table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
