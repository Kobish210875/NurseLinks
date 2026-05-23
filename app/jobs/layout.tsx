import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import JobsNav from "@/components/jobs/JobsNav";
import MarkJobsSeenOnOpen from "@/components/jobs/MarkJobsSeenOnOpen";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

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

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-[calc(100vh-4rem)] py-4 md:py-6">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          <header className="text-start">
            <h1 className="text-xl font-bold text-foreground">{t("jobs.title")}</h1>
          </header>
          <MarkJobsSeenOnOpen />
          <JobsNav />
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
