import Link from "next/link";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import ForgotPasswordForm from "@/components/login/ForgotPasswordForm";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;

  const errorMessage = params.error
    ? params.error === "missing-email"
      ? t("login.missing-email")
      : params.error === "email-rate-limit"
        ? t("errors.email-rate-limit")
        : params.error === "reset-link-expired"
          ? t("login.resetLinkExpired")
          : decodeURIComponent(params.error)
    : null;

  return (
    <div className="feed-page flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-nav-bg px-4 py-3">
        <Link href="/">
          <NurseLinkWordmark textClassName="text-primary" />
        </Link>
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <ForgotPasswordForm errorMessage={errorMessage} sent={params.sent === "1"} />
      </main>
    </div>
  );
}
