import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function updateProfile(userId: string, fields: ProfileUpdate) {
  const supabase = await createClient();

  return supabase
    .from("profiles")
    // Postgrest builder loses Update typing on createServerClient; fields are validated locally.
    .update(fields as never)
    .eq("id", userId);
}
