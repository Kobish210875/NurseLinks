import Navbar from "@/components/Navbar";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import RegisterForm from "@/components/register/RegisterForm";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification-config";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

const knownErrors = new Set([
  "missing-fields",
  "invalid-city",
  "invalid-hebrew-name",
  "password-non-english",
  "password-weak",
  "email-already-registered",
  "missing-supabase-env",
  "invalid-supabase-env",
  "supabase-connection-failed",
  "email-rate-limit",
]);

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;

  const errorMessage = params.error
    ? knownErrors.has(params.error)
      ? t(`errors.${params.error}`)
      : decodeURIComponent(params.error)
    : null;
  const requireEmailVerification = isEmailVerificationRequired();

  return (
    <>
      <Navbar />
      <main className="feed-page min-h-[calc(100vh-3.5rem)] px-4 py-10">
        <section className="mx-auto grid max-w-[960px] gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="feed-card p-6 text-start">
            <p className="mb-3 text-sm font-semibold text-accent">{t("register.joinNetwork")}</p>
            <h1 className="mb-4 text-3xl font-bold text-primary">
              <NurseLinkWordmark textClassName="text-primary" />
            </h1>
            <p className="leading-relaxed text-muted-foreground">{t("register.intro")}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>• {t("register.bullet1")}</li>
              <li>• {t("register.bullet2")}</li>
              <li>• {t("register.bullet3")}</li>
            </ul>
          </div>

          <Suspense fallback={<div className="feed-card p-6 text-sm text-muted-foreground">…</div>}>
            <RegisterForm
              serverError={errorMessage}
              requireEmailVerification={requireEmailVerification}
            />
          </Suspense>
        </section>
      </main>
    </>
  );
}
