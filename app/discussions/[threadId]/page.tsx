import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import DiscussionThreadView from "@/components/discussions/DiscussionThreadView";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDiscussionThread } from "@/lib/data/discussions";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type DiscussionThreadPageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function DiscussionThreadPage({ params }: DiscussionThreadPageProps) {
  const [{ threadId }, user, locale, supabase] = await Promise.all([
    params,
    getCurrentUser(),
    getLocale(),
    createClient(),
  ]);

  if (!user) {
    redirect("/");
  }

  const t = createT(getMessages(locale));
  const result = await getDiscussionThread(supabase, threadId, user.id, locale);

  if ("error" in result) {
    if (result.error === "not-found") {
      redirect("/discussions");
    }

    return (
      <div className="home-page-root flex min-h-screen flex-col">
        <Navbar authenticated />
        <main className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            <p className="font-semibold">{t("discussions.notConfiguredTitle")}</p>
            <p className="mt-2 leading-relaxed">{t("discussions.notConfigured")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page flex min-h-0 w-full min-w-0 max-w-[100vw] flex-1 flex-col overflow-x-clip py-3 max-md:h-auto max-md:overflow-visible md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col px-3 sm:px-4">
          <Link
            href="/discussions"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            ← {t("discussions.backToList")}
          </Link>
          <DiscussionThreadView thread={result.thread} isAdmin={user.isAdmin} />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
