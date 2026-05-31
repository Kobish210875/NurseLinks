import { NavCountsProvider } from "@/components/nav/NavCountsProvider";
import { getPendingInvitationCount } from "@/lib/data/connections";
import { getNavJobsUnreadCount } from "@/lib/data/jobs";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";

type NavCountsLoaderProps = {
  userId: string;
  children: React.ReactNode;
};

/** Fetches nav badge counts without blocking the rest of the root layout. */
export default async function NavCountsLoader({ userId, children }: NavCountsLoaderProps) {
  const supabase = await createClient();
  const [pendingInvitations, unreadMessages, unreadJobs] = await Promise.all([
    getPendingInvitationCount(supabase, userId),
    getUnreadMessageCount(supabase, userId),
    getNavJobsUnreadCount(supabase, userId),
  ]);

  return (
    <NavCountsProvider
      pendingInvitations={pendingInvitations}
      unreadMessages={unreadMessages}
      unreadJobs={unreadJobs}
    >
      {children}
    </NavCountsProvider>
  );
}
