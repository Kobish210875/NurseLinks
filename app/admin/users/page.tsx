import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveAdminUsersErrorMessage } from "@/lib/admin/page-errors";
import { getAdminUsers } from "@/lib/admin/users";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    deleted?: string;
  }>;
};

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const { users, summary, error } = await getAdminUsers(query);

  const errorMessage = resolveAdminUsersErrorMessage(t, params.error, error);

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page min-h-0 w-full min-w-0 max-w-[100vw] flex-1 overflow-hidden py-4 max-md:block max-md:flex-none max-md:overflow-x-clip max-md:py-8 max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.75rem)] md:py-6">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1128px] flex-col gap-3 overflow-hidden px-4 max-md:block max-md:h-auto max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.5rem)]">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.usersTitle")}</h1>
        </div>

        {params.deleted === "1" ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {t("admin.userDeleted")}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form className="feed-card shrink-0 flex flex-col gap-3 p-4 sm:flex-row">
          <label className="sr-only" htmlFor="admin-users-search">
            {t("admin.searchUsers")}
          </label>
          <input
            id="admin-users-search"
            name="q"
            defaultValue={query}
            className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm"
            placeholder={t("admin.searchUsers")}
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {t("nav.search")}
          </button>
        </form>

        <section className="feed-card flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-[min(24rem,50vh)] max-md:flex-none max-md:overflow-visible">
          <div className="border-b border-border bg-muted/20 px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">{t("admin.usersWindowTitle")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {query ? t("admin.usersWindowFilteredHint") : t("admin.usersWindowHint")}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto max-md:overflow-x-auto max-md:overflow-y-visible max-md:overscroll-auto" dir="ltr">
            <table className="w-full min-w-[760px] text-right text-sm" dir="rtl">
              <thead className="sticky top-0 z-10 bg-muted text-xs font-semibold text-muted-foreground shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-right">{t("admin.user")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.status")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.joinedAt")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.lastLogin")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const status = user.deletedAt
                    ? t("admin.statusDeleted")
                    : user.emailConfirmedAt
                      ? t("admin.statusActive")
                      : t("admin.statusPendingEmail");

                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{status}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(user.createdAt, locale)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(user.lastSignInAt, locale)}
                      </td>
                      <td className="px-4 py-2.5">
                        {user.isAdmin ? (
                          <span className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary">
                            {t("admin.badge")}
                          </span>
                        ) : (
                          <AdminDeleteUserButton userId={user.id} userName={user.fullName} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {t("admin.noUsers")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="feed-card shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <div className="font-semibold text-foreground">
            {t("admin.usersCountLine")
              .replace("{shown}", String(summary.shown))
              .replace("{total}", String(summary.total))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {t("admin.usersActiveCount").replace("{count}", String(summary.active))}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
              {t("admin.usersPendingCount").replace("{count}", String(summary.pendingEmail))}
            </span>
          </div>
        </section>

        <div className="mobile-feed-bottom-spacer md:hidden" aria-hidden="true" />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
