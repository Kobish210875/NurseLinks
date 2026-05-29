import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SuspensionStatus = {
  suspended: boolean;
  until: string | null;
};

export async function getSuspensionStatus(userId: string): Promise<SuspensionStatus> {
  const admin = createAdminClient();
  const client = admin ?? (await createClient());

  const { data } = await client
    .from("profiles")
    .select("suspended_until")
    .eq("id", userId)
    .maybeSingle<{ suspended_until: string | null }>();

  const until = data?.suspended_until ?? null;
  if (!until) {
    return { suspended: false, until: null };
  }

  const untilMs = new Date(until).getTime();
  if (Number.isNaN(untilMs) || untilMs <= Date.now()) {
    return { suspended: false, until: null };
  }

  return { suspended: true, until };
}

export async function assertUserCanPublish(userId: string): Promise<
  | { ok: true }
  | { ok: false; error: "suspended" }
> {
  const status = await getSuspensionStatus(userId);
  if (status.suspended) {
    return { ok: false, error: "suspended" };
  }
  return { ok: true };
}
