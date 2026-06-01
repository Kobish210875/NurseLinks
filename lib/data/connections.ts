import { getInitials } from "@/lib/auth/initials";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import type {
  ConnectionStatus,
  NetworkMember,
  NetworkRecommendation,
  RecommendationSource,
} from "@/lib/network/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type ConnectionRow = {
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  workplace_institution_slug?: string | null;
  avatar_url: string | null;
  cv_draft?: unknown;
  deleted_at?: string | null;
};

type RecommendationSnapshotRow = {
  user_id: string;
  candidate_id: string;
  mutual_count: number;
  mutual_ids: string[];
  source?: RecommendationSource;
  institution_slug?: string | null;
  rank: number;
};

type RecommendationRpcRow = {
  profile_id: string;
  mutual_count: number;
  mutual_ids?: string[] | null;
  source?: RecommendationSource;
  institution_slug?: string | null;
};

function parseRecommendationSource(value: unknown): RecommendationSource {
  if (value === "workplace" || value === "both" || value === "mutual") {
    return value;
  }
  return "mutual";
}

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function resolveConnectionStatus(
  userId: string,
  otherId: string,
  rows: ConnectionRow[],
): { status: ConnectionStatus; connectedAt: string | null; requesterId: string | null } {
  const row = rows.find(
    (r) =>
      (r.requester_id === userId && r.addressee_id === otherId) ||
      (r.requester_id === otherId && r.addressee_id === userId),
  );

  if (!row) {
    return { status: "none", connectedAt: null, requesterId: null };
  }

  if (row.status === "blocked") {
    return { status: "blocked", connectedAt: null, requesterId: row.requester_id };
  }

  if (row.status === "accepted") {
    return { status: "connected", connectedAt: row.updated_at, requesterId: row.requester_id };
  }

  if (row.requester_id === userId) {
    return { status: "pending_out", connectedAt: null, requesterId: row.requester_id };
  }

  return { status: "pending_in", connectedAt: null, requesterId: row.requester_id };
}

export async function loadConnectionRows(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ConnectionRow[]> {
  const { data } = await supabase
    .from("connections")
    .select("requester_id, addressee_id, status, created_at, updated_at")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  return (data ?? []) as ConnectionRow[];
}

async function loadProfilesByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Map<string, ProfileRow>> {
  if (!ids.length) {
    return new Map();
  }

  const selectWithWorkplace =
    "id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft, deleted_at";
  let { data, error } = await supabase.from("profiles").select(selectWithWorkplace).in("id", ids);

  const msg = error?.message?.toLowerCase() ?? "";
  if (msg.includes("workplace_institution_slug") || msg.includes("deleted_at")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, cv_draft")
      .in("id", ids);
    data = fallback.data;
  }

  return new Map(
    ((data ?? []) as ProfileRow[])
      .filter((p) => !p.deleted_at)
      .map((p) => [p.id, p]),
  );
}

function toMember(
  profile: ProfileRow,
  meta: ReturnType<typeof resolveConnectionStatus>,
): NetworkMember {
  const fullName = profile.full_name.trim() || "User";
  return {
    id: profile.id,
    fullName,
    headline: profile.headline,
    workplaceInstitutionSlug: resolveWorkplaceSlug(
      profile.workplace_institution_slug,
      profile.cv_draft,
    ),
    avatarUrl: profile.avatar_url,
    initials: getInitials(fullName),
    connectionStatus: meta.status,
    connectedAt: meta.connectedAt,
    requesterId: meta.requesterId,
  };
}

export async function getAcceptedConnections(
  supabase: SupabaseClient<Database>,
  userId: string,
  connectionRows?: ConnectionRow[],
  limit?: number,
): Promise<NetworkMember[]> {
  const rows = connectionRows ?? (await loadConnectionRows(supabase, userId));
  let accepted = rows.filter((r) => r.status === "accepted");

  // When a display limit is requested, keep only the most-recently-connected
  // entries so we avoid fetching and serializing an unbounded profile set.
  if (limit !== undefined) {
    accepted = accepted
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);
  }

  const peerIds = accepted.map((r) =>
    r.requester_id === userId ? r.addressee_id : r.requester_id,
  );
  const profiles = await loadProfilesByIds(supabase, peerIds);

  return peerIds
    .map((id) => {
      const profile = profiles.get(id);
      if (!profile) {
        return null;
      }
      return toMember(profile, resolveConnectionStatus(userId, id, rows));
    })
    .filter((m): m is NetworkMember => m !== null)
    .sort((a, b) => {
      const at = a.connectedAt ? new Date(a.connectedAt).getTime() : 0;
      const bt = b.connectedAt ? new Date(b.connectedAt).getTime() : 0;
      return bt - at;
    });
}

export async function getPendingInvitationCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("addressee_id", userId)
    .eq("status", "pending");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getPendingInvitations(
  supabase: SupabaseClient<Database>,
  userId: string,
  connectionRows?: ConnectionRow[],
): Promise<NetworkMember[]> {
  const rows = connectionRows ?? (await loadConnectionRows(supabase, userId));
  const incoming = rows.filter((r) => r.status === "pending" && r.addressee_id === userId);
  const profiles = await loadProfilesByIds(
    supabase,
    incoming.map((r) => r.requester_id),
  );

  return incoming
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => {
      const profile = profiles.get(r.requester_id);
      if (!profile) {
        return null;
      }
      return toMember(profile, resolveConnectionStatus(userId, r.requester_id, rows));
    })
    .filter((m): m is NetworkMember => m !== null);
}

export async function searchPeople(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string,
  limit = 20,
  connectionRows?: ConnectionRow[],
): Promise<NetworkMember[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const rows = connectionRows ?? (await loadConnectionRows(supabase, userId));
  const pattern = `%${escapeIlike(trimmed)}%`;

  let { data: profilesRaw, error: searchError } = await supabase
    .from("profiles")
    .select("id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft, deleted_at")
    .neq("id", userId)
    .is("deleted_at", null)
    .ilike("full_name", pattern)
    .order("full_name", { ascending: true })
    .limit(limit);

  const searchMsg = searchError?.message?.toLowerCase() ?? "";
  if (searchMsg.includes("workplace_institution_slug") || searchMsg.includes("deleted_at")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, cv_draft")
      .neq("id", userId)
      .ilike("full_name", pattern)
      .order("full_name", { ascending: true })
      .limit(limit);
    profilesRaw = fallback.data;
  }

  const profiles = (profilesRaw ?? []) as ProfileRow[];

  return profiles
    .filter((p) => !p.deleted_at)
    .map((p) => toMember(p, resolveConnectionStatus(userId, p.id, rows)));
}

async function loadDismissedRecommendationIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("connection_recommendation_dismissals")
    .select("dismissed_user_id")
    .eq("user_id", userId);

  if (error) {
    return new Set();
  }

  return new Set(
    (data ?? []).map((row) => (row as { dismissed_user_id: string }).dismissed_user_id),
  );
}

export async function getConnectionRecommendations(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 10,
  connectionRows?: ConnectionRow[],
): Promise<NetworkRecommendation[]> {
  const rows = connectionRows ?? (await loadConnectionRows(supabase, userId));

  // Run dismissals fetch and snapshot query in parallel — they are independent.
  const [dismissedIds, initialSnapshotResult] = await Promise.all([
    loadDismissedRecommendationIds(supabase, userId),
    supabase
      .from("connection_recommendation_snapshots")
      .select("user_id, candidate_id, mutual_count, mutual_ids, source, institution_slug, rank")
      .eq("user_id", userId)
      .order("rank", { ascending: true })
      .limit(limit),
  ]);

  let data: RecommendationRpcRow[] = [];
  let snapshotResult = initialSnapshotResult;

  if (snapshotResult.error?.message?.toLowerCase().includes("source")) {
    snapshotResult = await supabase
      .from("connection_recommendation_snapshots")
      .select("user_id, candidate_id, mutual_count, mutual_ids, rank")
      .eq("user_id", userId)
      .order("rank", { ascending: true })
      .limit(limit);
  }

  if (!snapshotResult.error && (snapshotResult.data?.length ?? 0) > 0) {
    data = ((snapshotResult.data ?? []) as RecommendationSnapshotRow[]).map((row) => ({
      profile_id: row.candidate_id,
      mutual_count: Number(row.mutual_count),
      mutual_ids: row.mutual_ids ?? [],
      source: parseRecommendationSource(row.source),
      institution_slug: row.institution_slug ?? null,
    }));
  } else {
    const rpc = await supabase.rpc("connection_recommendations", { limit_count: limit } as never);
    data = ((rpc.data ?? []) as RecommendationRpcRow[]).map((row) => ({
      ...row,
      source: parseRecommendationSource(row.source),
    }));
  }

  if (dismissedIds.size > 0) {
    data = data.filter((row) => !dismissedIds.has(row.profile_id));
  }

  const ids = [...new Set(data.flatMap((row) => [row.profile_id, ...(row.mutual_ids ?? [])]))];
  const profiles = await loadProfilesByIds(supabase, ids);

  return data
    .map((row) => {
      const profile = profiles.get(row.profile_id);
      if (!profile) {
        return null;
      }
      return {
        ...toMember(profile, resolveConnectionStatus(userId, row.profile_id, rows)),
        recommendationSource: parseRecommendationSource(row.source),
        institutionSlug: row.institution_slug?.trim() || null,
        mutualCount: Number(row.mutual_count),
        mutualConnections: (row.mutual_ids ?? [])
          .map((id) => {
            const mutual = profiles.get(id);
            if (!mutual) {
              return null;
            }
            const fullName = mutual.full_name.trim() || "User";
            return {
              id,
              fullName,
              avatarUrl: mutual.avatar_url,
              initials: getInitials(fullName),
            };
          })
          .filter((m): m is NonNullable<typeof m> => m !== null),
      } satisfies NetworkRecommendation;
    })
    .filter((m): m is NetworkRecommendation => m !== null);
}

export type NetworkPageData = {
  connections: NetworkMember[];
  invitations: NetworkMember[];
  searchResults: NetworkMember[];
  recommendations: NetworkRecommendation[];
};

/** Single connection-row fetch for the network page (avoids duplicate queries). */
export async function getNetworkPageData(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string,
): Promise<NetworkPageData> {
  const connectionRows = await loadConnectionRows(supabase, userId);
  const trimmed = query.trim();
  const showSearch = trimmed.length >= 2;

  const [connections, invitations, searchResults, recommendations] = await Promise.all([
    getAcceptedConnections(supabase, userId, connectionRows, 100),
    getPendingInvitations(supabase, userId, connectionRows),
    showSearch ? searchPeople(supabase, userId, trimmed, 20, connectionRows) : Promise.resolve([]),
    showSearch
      ? Promise.resolve([])
      : getConnectionRecommendations(supabase, userId, 10, connectionRows),
  ]);

  return { connections, invitations, searchResults, recommendations };
}

export async function getNetworkPeer(
  supabase: SupabaseClient<Database>,
  userId: string,
  peerId: string,
): Promise<NetworkMember | null> {
  const rows = await loadConnectionRows(supabase, userId);
  const profiles = await loadProfilesByIds(supabase, [peerId]);
  const profile = profiles.get(peerId);
  if (!profile) {
    return null;
  }
  return toMember(profile, resolveConnectionStatus(userId, peerId, rows));
}
