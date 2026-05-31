import Link from "next/link";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import ResetPasswordForm from "@/components/login/ResetPasswordForm";
import ResetPasswordSessionGate from "@/components/login/ResetPasswordSessionGate";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;

  const errorMessage = params.error
    ? params.error === "missing-password"
      ? t("login.missing-password")
      : params.error === "reset-session-expired"
        ? t("login.resetSessionExpired")
        : params.error.startsWith("password-")
          ? t(`errors.${params.error}`)
          : params.error === "email-rate-limit"
            ? t("errors.email-rate-limit")
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
        <ResetPasswordSessionGate>
          <ResetPasswordForm errorMessage={errorMessage} />
        </ResetPasswordSessionGate>
      </main>
    </div>
  );
}
