import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: callerError } = await adminAuthClient.auth.getUser(token);
    if (callerError || !callerUser) {
      return json({ error: "Unauthorized caller" }, 401);
    }

    // Check caller has admin role
    const { data: hasAdminRole } = await adminAuthClient.rpc("has_role", {
      _user_id: callerUser.id,
      _role: "admin",
    });

    if (!hasAdminRole) {
      return json({ error: "Forbidden: Admin access required" }, 403);
    }

    const body = await req.json();
    const action = body.action || "create_vendor";

    if (action === "create_vendor") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const shopName = String(body.shop_name || "").trim();
      const shopNameBn = String(body.shop_name_bn || shopName).trim();
      let shopSlug = String(body.shop_slug || "").trim().toLowerCase();
      const ownerName = String(body.owner_name || "").trim();
      const phone = String(body.phone || "").trim();
      const commissionPercent = Number(body.commission_percent) || 10;
      const division = String(body.division || "রাজশাহী");
      const district = String(body.district || "নওগাঁ");
      const upazila = String(body.upazila || "সাপাহার");
      const address = String(body.address || "").trim();
      const description = String(body.description || "").trim();

      if (!email || !password || !shopName || !ownerName) {
        return json({ error: "দোকানের নাম, মালিকের নাম, ইমেইল ও পাসওয়ার্ড দিন।" }, 400);
      }

      if (password.length < 6) {
        return json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, 400);
      }

      // Check if user already exists in auth
      let authUserId: string;
      const { data: listData } = await adminAuthClient.auth.admin.listUsers();
      const existingUser = listData?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existingUser) {
        authUserId = existingUser.id;
        // Update password and confirm email
        const { error: updateErr } = await adminAuthClient.auth.admin.updateUserById(authUserId, {
          password,
          email_confirm: true,
          user_metadata: { full_name: ownerName, phone },
        });
        if (updateErr) throw updateErr;
      } else {
        // Create clean auth user using official GoTrue Admin API
        const { data: createData, error: createErr } = await adminAuthClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: ownerName, phone },
        });
        if (createErr) throw createErr;
        if (!createData.user) throw new Error("Auth user creation failed");
        authUserId = createData.user.id;
      }

      // Ensure user role
      await adminAuthClient.from("user_roles").upsert(
        { user_id: authUserId, role: "vendor" },
        { onConflict: "user_id,role" }
      );

      // Upsert profile
      await adminAuthClient.from("profiles").upsert(
        { user_id: authUserId, full_name: ownerName, phone },
        { onConflict: "user_id" }
      );

      // Ensure slug uniqueness
      if (!shopSlug) {
        shopSlug = shopName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") || `vendor-${Date.now()}`;
      }
      const { data: existingSlug } = await adminAuthClient
        .from("vendors")
        .select("id")
        .eq("shop_slug", shopSlug)
        .maybeSingle();

      if (existingSlug) {
        shopSlug = `${shopSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Insert or update vendor
      const { data: existingVendor } = await adminAuthClient
        .from("vendors")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let vendorId: string;
      if (existingVendor) {
        vendorId = existingVendor.id;
        const { error: vendUpdateErr } = await adminAuthClient
          .from("vendors")
          .update({
            user_id: authUserId,
            shop_name: shopName,
            shop_name_bn: shopNameBn,
            owner_name: ownerName,
            phone,
            account_password: password,
            division,
            district,
            upazila,
            address,
            description,
            commission_percent: commissionPercent,
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: callerUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vendorId);

        if (vendUpdateErr) throw vendUpdateErr;
      } else {
        const { data: newVend, error: vendInsertErr } = await adminAuthClient
          .from("vendors")
          .insert({
            user_id: authUserId,
            shop_name: shopName,
            shop_name_bn: shopNameBn,
            shop_slug: shopSlug,
            owner_name: ownerName,
            nid_number: "",
            phone,
            email,
            account_password: password,
            division,
            district,
            upazila,
            address,
            description,
            commission_percent: commissionPercent,
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: callerUser.id,
          })
          .select("id")
          .single();

        if (vendInsertErr) throw vendInsertErr;
        vendorId = newVend.id;
      }

      return json({
        success: true,
        vendor_id: vendorId,
        user_id: authUserId,
        shop_slug: shopSlug,
      });
    }

    if (action === "update_password") {
      const vendorId = String(body.vendor_id || "").trim();
      const newPassword = String(body.new_password || "").trim();

      if (!vendorId || !newPassword) {
        return json({ error: "ভেন্ডর আইডি ও নতুন পাসওয়ার্ড দিন।" }, 400);
      }

      if (newPassword.length < 6) {
        return json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, 400);
      }

      const { data: vendor, error: vendErr } = await adminAuthClient
        .from("vendors")
        .select("id, user_id, email")
        .eq("id", vendorId)
        .single();

      if (vendErr || !vendor) {
        return json({ error: "ভেন্ডর খুঁজে পাওয়া যায়নি।" }, 404);
      }

      let userId = vendor.user_id;

      if (!userId) {
        // Find by email or create auth user
        const { data: listData } = await adminAuthClient.auth.admin.listUsers();
        const found = listData?.users?.find((u) => u.email?.toLowerCase() === vendor.email?.toLowerCase());
        if (found) {
          userId = found.id;
        } else {
          const { data: newUser, error: newErr } = await adminAuthClient.auth.admin.createUser({
            email: vendor.email,
            password: newPassword,
            email_confirm: true,
          });
          if (newErr) throw newErr;
          userId = newUser.user!.id;
        }
      }

      // Update password in GoTrue
      const { error: authErr } = await adminAuthClient.auth.admin.updateUserById(userId, {
        password: newPassword,
        email_confirm: true,
      });
      if (authErr) throw authErr;

      // Update in public.vendors
      const { error: updErr } = await adminAuthClient
        .from("vendors")
        .update({
          user_id: userId,
          account_password: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId);

      if (updErr) throw updErr;

      return json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err: any) {
    console.error("admin-vendor-auth error:", err);
    return json({ error: err.message || "Unknown server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
