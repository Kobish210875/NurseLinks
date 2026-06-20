import Footer from "@/components/Footer";
import AdminModerationPanel from "@/components/admin/AdminModerationPanel";
import AdminNavTabs from "@/components/admin/AdminNavTabs";
import Navbar from "@/components/Navbar";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminModerationFlags } from "@/lib/admin/moderation";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type AdminModerationPageProps = {
  searchParams: Promise<{ error?: string; done?: string }>;
};

export default async function AdminModerationPage({ searchParams }: AdminModerationPageProps) {
  await requireAdmin();
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;
  const { flags, error } = await getAdminModerationFlags("pending");

  const errorMessage =
    error === "missing-service-role"
      ? t("admin.missingServiceRole")
      : error === "not-configured"
        ? t("moderation.notConfigured")
        : error
          ? t("admin.moderationLoadFailed")
          : null;

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page min-h-0 flex-1 py-4 max-md:block max-md:flex-none max-md:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t("admin.badge")}
              </p>
              <h1 className="text-2xl font-bold text-foreground">{t("admin.moderationTitle")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.moderationSubtitle")}</p>
            </div>
            <AdminNavTabs />
          </div>

          {params.done === "1" ? (
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {t("admin.moderationDone")}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <AdminModerationPanel flags={flags} />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
