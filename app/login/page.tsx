import Link from "next/link";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import LoginForm from "@/components/login/LoginForm";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reset?: string; verified?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;

  const errorMessage = params.error
    ? params.error === "login-missing-fields"
      ? t("login.missing-fields")
      : params.error === "account-not-found"
        ? t("login.accountNotFound")
        : params.error === "email-not-confirmed"
          ? t("login.emailNotConfirmed")
        : params.error === "auth-callback-failed"
          ? t("login.authCallbackFailed")
          : params.error === "auth-profile-failed"
            ? t("login.authProfileFailed")
            : params.error === "email-rate-limit"
              ? t("errors.email-rate-limit")
              : decodeURIComponent(params.error)
    : null;
  const successMessage =
    params.reset === "success"
      ? t("login.resetSuccess")
      : params.verified === "1"
        ? t("login.emailVerifiedSuccess")
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
        <LoginForm errorMessage={errorMessage} successMessage={successMessage} />
      </main>
    </div>
  );
}
