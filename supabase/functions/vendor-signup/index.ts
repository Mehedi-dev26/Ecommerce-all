import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const VENDOR_EMAIL_DOMAIN = "sapaharshop.com";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");
const getVendorAuthEmail = (phone: string) =>
  `vendor.${normalizePhone(phone)}@${VENDOR_EMAIL_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, password, name, contact_email } = await req.json();
    const normalizedPhone = normalizePhone(String(phone ?? ""));
    const pwd = String(password ?? "");
    const fullName = String(name ?? "").trim();

    if (!BD_PHONE_REGEX.test(normalizedPhone))
      return json({ error: "সঠিক মোবাইল নাম্বার দিন।" }, 400);
    if (pwd.length < 6)
      return json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।" }, 400);
    if (fullName.length < 2)
      return json({ error: "মালিকের নাম দিন।" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const syntheticEmail = getVendorAuthEmail(normalizedPhone);

    const { data, error } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      password: pwd,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
        vendor_signup: true,
        contact_email: contact_email || null,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("registered") || msg.includes("duplicate")) {
        return json({ error: "এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করে চেষ্টা করুন।" }, 409);
      }
      throw error;
    }

    if (!data.user) throw new Error("Account creation failed");

    await supabase.from("profiles").upsert(
      { user_id: data.user.id, full_name: fullName, phone: normalizedPhone },
      { onConflict: "user_id" },
    );

    return json({ userId: data.user.id, syntheticEmail });
  } catch (err) {
    console.error("vendor-signup error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
