import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <>
      <Navbar />
      <main className="feed-page min-h-[calc(100vh-3.5rem)] px-4 py-10">
        <section className="mx-auto max-w-3xl">
          <article className="feed-card space-y-4 p-6 text-start">
            <h1 className="text-2xl font-bold text-foreground">{t("legal.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("legal.intro")}</p>
            <p className="leading-relaxed text-foreground">{t("legal.p1")}</p>
            <p className="leading-relaxed text-foreground">{t("legal.p2")}</p>
            <p className="leading-relaxed text-muted-foreground">{t("legal.p3")}</p>
            <div className="pt-2">
              <Link href="/register" className="text-sm font-semibold text-primary hover:underline">
                {t("legal.backToRegister")}
              </Link>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
