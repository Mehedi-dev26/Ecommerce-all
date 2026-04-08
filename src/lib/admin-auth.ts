import { supabase } from "@/integrations/supabase/client";

export async function hasAdminRole(userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _role: "admin",
    _user_id: userId,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}