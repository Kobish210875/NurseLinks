import { cookies } from "next/headers";

/** True when Supabase auth cookies are present (avoids remote session calls when logged out). */
export async function hasSupabaseAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}
