import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { requireAdmin } from "@/lib/auth/admin";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <>
      <Navbar authenticated />
      <main className="mx-auto max-w-[1128px] space-y-6 px-4 py-8">
        <section className="feed-card p-6">
          <p className="text-sm font-semibold text-primary">{t("admin.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{t("admin.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("admin.subtitle")}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/users"
            className="feed-card p-5 transition hover:border-primary/30 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-foreground">{t("admin.usersTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("admin.usersDescription")}
            </p>
          </Link>

          <div className="feed-card p-5 opacity-70">
            <h2 className="text-lg font-bold text-foreground">{t("admin.moderationTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("admin.comingSoon")}
            </p>
          </div>

          <div className="feed-card p-5 opacity-70">
            <h2 className="text-lg font-bold text-foreground">{t("admin.healthTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("admin.comingSoon")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
