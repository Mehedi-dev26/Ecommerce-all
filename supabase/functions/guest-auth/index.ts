import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const GUEST_EMAIL_DOMAIN = "example.com";

const normalizeGuestPhone = (phone: string) => phone.replace(/\D/g, "");
const getGuestAuthEmail = (phone: string) =>
  `customer.${normalizeGuestPhone(phone)}@${GUEST_EMAIL_DOMAIN}`;
const getGuestAuthPassword = (pin: string) => `guest-pin-${pin}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, pin, name, email } = await req.json();

    const normalizedPhone = normalizeGuestPhone(String(phone ?? ""));
    const normalizedPin = String(pin ?? "").replace(/\D/g, "").slice(0, 4);
    const fullName = String(name ?? "").trim();
    const recoveryEmail = String(email ?? "").trim() || null;

    if (!BD_PHONE_REGEX.test(normalizedPhone)) {
      return jsonResponse({ error: "সঠিক মোবাইল নম্বর দিন।" }, 400);
    }

    if (!/^\d{4}$/.test(normalizedPin)) {
      return jsonResponse({ error: "৪ ডিজিটের PIN দিন।" }, 400);
    }

    if (fullName.length < 3) {
      return jsonResponse({ error: "সম্পূর্ণ নাম লিখুন।" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const syntheticEmail = getGuestAuthEmail(normalizedPhone);
    const password = getGuestAuthPassword(normalizedPin);

    const { data, error } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
        recovery_email: recoveryEmail,
        guest_checkout: true,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("already") ||
        message.includes("exists") ||
        message.includes("registered") ||
        message.includes("duplicate")
      ) {
        return jsonResponse(
          { error: "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে। সঠিক ৪ ডিজিটের PIN দিন।" },
          409,
        );
      }

      throw error;
    }

    if (!data.user) {
      throw new Error("Guest account could not be created");
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: data.user.id,
        full_name: fullName,
        phone: normalizedPhone,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      throw profileError;
    }

    return jsonResponse({
      userId: data.user.id,
      syntheticEmail,
    });
  } catch (error) {
    console.error("guest-auth error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
