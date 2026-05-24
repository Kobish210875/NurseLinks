import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import JobsAutoRefresh from "@/components/jobs/JobsAutoRefresh";
import JobsNav from "@/components/jobs/JobsNav";
import MarkJobsSeenOnOpen from "@/components/jobs/MarkJobsSeenOnOpen";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getJobsVersion } from "@/lib/data/sync-versions";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const supabase = await createClient();
  const jobsVersion = await getJobsVersion(supabase, user.id);

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-4 md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4 overflow-x-clip px-3 sm:px-4">
          <header className="min-w-0 text-start">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {t("jobs.title")}
            </h1>
          </header>
          <JobsAutoRefresh initialVersion={jobsVersion} />
          <MarkJobsSeenOnOpen />
          <JobsNav />
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
