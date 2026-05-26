import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { Locale } from "@/lib/i18n/config";
import {
  JOB_COMMUNITY_PAGE_SIZE,
  type JobListFilters,
} from "@/lib/jobs/search-params";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type { JobListing, JobApplicationView, JobStatus } from "./jobs-types";

import type { JobListing, JobApplicationView } from "./jobs-types";

type JobRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  hospital: string | null;
  city: string | null;
  institution_slug?: string | null;
  status: "active" | "filled";
  created_at: string;
  updated_at: string;
  filled_at: string | null;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  full_name: string;
  phone: string;
  note: string | null;
  created_at: string;
  owner_read_at: string | null;
};

const JOB_MINE_MAX = 50;

export type JobFeedResult = {
  mine: JobListing[];
  community: JobListing[];
  page: number;
  pageSize: number;
  communityTotal: number;
  totalPages: number;
};

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function applyListFilters<T extends { eq: (col: string, val: string) => T; or: (filters: string) => T }>(
  query: T,
  filters: JobListFilters,
  withInstitutionSlug: boolean,
): T {
  let q = query;
  if (withInstitutionSlug && filters.institutionSlug) {
    q = q.eq("institution_slug", filters.institutionSlug);
  }
  if (filters.q) {
    const pattern = `%${escapeIlikePattern(filters.q)}%`;
    q = q.or(`title.ilike.${pattern},body.ilike.${pattern}`);
  }
  return q;
}

export async function getJobsListSeenAt(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data: view } = await supabase
    .from("job_list_views")
    .select("seen_at")
    .eq("user_id", userId)
    .maybeSingle<{ seen_at: string }>();

  if (view?.seen_at) {
    return view.seen_at;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle<{ created_at: string }>();

  return profile?.created_at ?? new Date().toISOString();
}

export async function markJobsListSeen(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const seenAt = new Date().toISOString();
  await supabase.from("job_list_views").upsert(
    { user_id: userId, seen_at: seenAt } as never,
    { onConflict: "user_id" },
  );
  return seenAt;
}

async function getMyActiveJobIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("jobs")
    .select("id")
    .eq("author_id", userId)
    .eq("status", "active");

  return ((data ?? []) as { id: string }[]).map((j) => j.id);
}

export async function markJobApplicationsRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
): Promise<boolean> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("author_id", userId)
    .maybeSingle();

  if (!job) {
    return false;
  }

  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("job_applications")
    .update({ owner_read_at: readAt } as never)
    .eq("job_id", jobId)
    .is("owner_read_at", null);

  return !error;
}

export async function markAllJobApplicationsRead(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const jobIds = await getMyActiveJobIds(supabase, userId);
  if (!jobIds.length) {
    return 0;
  }

  const readAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("job_applications")
    .update({ owner_read_at: readAt } as never)
    .in("job_id", jobIds)
    .is("owner_read_at", null)
    .select("id");

  if (error) {
    return 0;
  }

  return (data ?? []).length;
}

export async function getUnreadCommunityJobCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const seenAt = await getJobsListSeenAt(supabase, userId);

  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .neq("author_id", userId)
    .gt("created_at", seenAt);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getUnreadJobApplicationCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const jobIds = await getMyActiveJobIds(supabase, userId);
  if (!jobIds.length) {
    return 0;
  }

  let { count, error } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .in("job_id", jobIds)
    .is("owner_read_at", null);

  if (error?.message?.toLowerCase().includes("owner_read_at")) {
    return 0;
  }

  if (error) {
    return 0;
  }

  return count ?? 0;
}

/** Nav blue dot: new community jobs or new applications on my postings. */
export async function getNavJobsUnreadCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const [community, applications] = await Promise.all([
    getUnreadCommunityJobCount(supabase, userId),
    getUnreadJobApplicationCount(supabase, userId),
  ]);
  return community + applications;
}

/** @deprecated Use getNavJobsUnreadCount or getUnreadCommunityJobCount */
export async function getUnreadJobCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  return getNavJobsUnreadCount(supabase, userId);
}

async function enrichJobRows(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: JobRow[],
  locale: Locale,
  lastSeen: string,
): Promise<JobListing[]> {
  if (!rows.length) {
    return [];
  }

  const jobIds = rows.map((j) => j.id);
  const ownedJobIds = rows.filter((j) => j.author_id === userId).map((j) => j.id);

  let myApplicationsRaw: { job_id: string }[] = [];
  let receivedApplicationsRaw: ApplicationRow[] = [];

  const applicationsQueries = await Promise.all([
    supabase.from("job_applications").select("job_id").eq("applicant_id", userId).in("job_id", jobIds),
    ownedJobIds.length
      ? supabase
          .from("job_applications")
          .select(
            "id, job_id, applicant_id, full_name, phone, note, created_at, owner_read_at",
          )
          .in("job_id", ownedJobIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ApplicationRow[], error: null }),
  ]);

  const appsConfigured = !applicationsQueries.some(
    (res) => res.error?.message?.toLowerCase().includes("job_applications"),
  );

  if (appsConfigured) {
    myApplicationsRaw = (applicationsQueries[0].data ?? []) as { job_id: string }[];
    let received = (applicationsQueries[1].data ?? []) as ApplicationRow[];

    if (
      ownedJobIds.length &&
      applicationsQueries[1].error?.message?.toLowerCase().includes("owner_read_at")
    ) {
      const fallback = await supabase
        .from("job_applications")
        .select("id, job_id, applicant_id, full_name, phone, note, created_at")
        .in("job_id", ownedJobIds)
        .order("created_at", { ascending: false });
      received = ((fallback.data ?? []) as Omit<ApplicationRow, "owner_read_at">[]).map((row) => ({
        ...row,
        owner_read_at: new Date().toISOString(),
      }));
    }

    receivedApplicationsRaw = received;
  }

  const appliedJobIds = new Set(myApplicationsRaw.map((row) => row.job_id));

  const applicationsByJob = new Map<string, JobApplicationView[]>();
  for (const row of receivedApplicationsRaw) {
    const list = applicationsByJob.get(row.job_id) ?? [];
    list.push({
      id: row.id,
      applicantId: row.applicant_id,
      fullName: row.full_name,
      phone: row.phone,
      note: row.note,
      createdAt: row.created_at,
      timeLabel: formatFeedTimestamp(row.created_at, locale),
      isUnread: row.owner_read_at == null,
    });
    applicationsByJob.set(row.job_id, list);
  }

  return rows.map((j) => {
    const apps = applicationsByJob.get(j.id) ?? [];
    const isOwner = j.author_id === userId;
    const hasNewApplications = isOwner && apps.some((app) => app.isUnread);

    return {
      id: j.id,
      isOwner,
      title: j.title,
      body: j.body,
      hospital: j.hospital,
      city: j.city,
      status: j.status,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      filledAt: j.filled_at,
      timeLabel: formatFeedTimestamp(j.created_at, locale),
      isUnread:
        j.status === "active" &&
        !isOwner &&
        new Date(j.created_at).getTime() > new Date(lastSeen).getTime(),
      hasApplied: appliedJobIds.has(j.id),
      hasNewApplications,
      applications: apps,
    };
  });
}

async function fetchJobRows(
  supabase: SupabaseClient<Database>,
  filters: JobListFilters,
  options: {
    authorId?: string;
    excludeAuthorId?: string;
    limit?: number;
    range?: { from: number; to: number };
  },
): Promise<JobRow[]> {
  const selectWithSlug =
    "id, author_id, title, body, hospital, city, institution_slug, status, created_at, updated_at, filled_at";
  const selectFallback =
    "id, author_id, title, body, hospital, city, status, created_at, updated_at, filled_at";

  const build = (withSlug: boolean) => {
    let query = supabase
      .from("jobs")
      .select(withSlug ? selectWithSlug : selectFallback)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (options.authorId) {
      query = query.eq("author_id", options.authorId);
    }
    if (options.excludeAuthorId) {
      query = query.neq("author_id", options.excludeAuthorId);
    }

    query = applyListFilters(query, filters, withSlug);

    if (options.range) {
      query = query.range(options.range.from, options.range.to);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    return query;
  };

  let { data, error } = await build(true);
  if (error?.message?.toLowerCase().includes("institution_slug")) {
    ({ data, error } = await build(false));
  }

  if (error) {
    return [];
  }

  return (data ?? []) as JobRow[];
}

async function countCommunityJobs(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: JobListFilters,
): Promise<number> {
  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .neq("author_id", userId);

  if (filters.institutionSlug) {
    query = query.eq("institution_slug", filters.institutionSlug);
  }
  if (filters.q) {
    const pattern = `%${escapeIlikePattern(filters.q)}%`;
    query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`);
  }

  let { count, error } = await query;

  if (error?.message?.toLowerCase().includes("institution_slug")) {
    let fallback = supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .neq("author_id", userId);
    if (filters.q) {
      const pattern = `%${escapeIlikePattern(filters.q)}%`;
      fallback = fallback.or(`title.ilike.${pattern},body.ilike.${pattern}`);
    }
    ({ count, error } = await fallback);
  }

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getJobFeed(
  supabase: SupabaseClient<Database>,
  userId: string,
  locale: Locale,
  filters: JobListFilters = { q: "", institutionSlug: "", page: 1 },
  seenAt?: string,
): Promise<JobFeedResult> {
  const lastSeen = seenAt ?? (await getJobsListSeenAt(supabase, userId));
  const page = filters.page;

  const [mineRows, communityTotal] = await Promise.all([
    fetchJobRows(supabase, filters, { authorId: userId, limit: JOB_MINE_MAX }),
    countCommunityJobs(supabase, userId, filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(communityTotal / JOB_COMMUNITY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * JOB_COMMUNITY_PAGE_SIZE;
  const to = from + JOB_COMMUNITY_PAGE_SIZE - 1;

  const communityRows = await fetchJobRows(supabase, filters, {
    excludeAuthorId: userId,
    range: { from, to },
  });

  const [mine, community] = await Promise.all([
    enrichJobRows(supabase, userId, mineRows, locale, lastSeen),
    enrichJobRows(supabase, userId, communityRows, locale, lastSeen),
  ]);

  return {
    mine,
    community,
    page: safePage,
    pageSize: JOB_COMMUNITY_PAGE_SIZE,
    communityTotal,
    totalPages,
  };
}

/** @deprecated Use getJobFeed */
export async function getJobListings(
  supabase: SupabaseClient<Database>,
  userId: string,
  locale: Locale,
  filters: JobListFilters = { q: "", institutionSlug: "", page: 1 },
  seenAt?: string,
): Promise<JobListing[]> {
  const feed = await getJobFeed(supabase, userId, locale, filters, seenAt);
  return [...feed.mine, ...feed.community];
}
