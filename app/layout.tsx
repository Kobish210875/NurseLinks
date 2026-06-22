import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CurrentUserProvider } from "@/components/nav/CurrentUserProvider";
import MessagingDockShell from "@/components/messages/MessagingDockShell";
import MobileBottomNav from "@/components/nav/MobileBottomNav";
import MobileShellEffects from "@/components/nav/MobileShellEffects";
import InstallPwaHint from "@/components/pwa/InstallPwaHint";
import { NavCountsProvider } from "@/components/nav/NavCountsProvider";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPendingInvitationCount } from "@/lib/data/connections";
import { getNavJobsUnreadCount } from "@/lib/data/jobs";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";
import DevEnvironmentBanner from "@/components/dev/DevEnvironmentBanner";
import { getAppEnvironment, isDevLikeApp } from "@/lib/env/app-environment";
import { getDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "overlays-content",
  themeColor: "#2b6cb0",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const siteUrl = getSiteUrl();
  const description = t("meta.description");

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "NurseLinks",
      template: "%s | NurseLinks",
    },
    description,
    applicationName: "NurseLinks",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "NurseLinks",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: locale === "he" ? "he_IL" : "en_US",
      url: siteUrl,
      siteName: "NurseLinks",
      title: "NurseLinks",
      description,
    },
    twitter: {
      card: "summary",
      title: "NurseLinks",
      description,
    },
  };
}

/**
 * Async shell that resolves the current user and provides it to client
 * context. Isolated here so the outer RootLayout can return the HTML
 * skeleton (html/body/LocaleProvider/NavCountsProvider) without waiting
 * for the Supabase auth call.
 *
 * Auth protection: every protected page still calls getCurrentUser() itself
 * and redirects to "/" when null. Moving the call here does not change that.
 * React's `cache()` deduplicates the Supabase round-trip within the same
 * render, so whichever component calls it first "wins" and the rest pay 0ms.
 */
async function RootUserShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let navCounts = {
    pendingInvitations: 0,
    unreadMessages: 0,
    unreadJobs: 0,
  };

  if (user) {
    const supabase = await createClient();
    const [pendingInvitations, unreadMessages, unreadJobs] = await Promise.all([
      getPendingInvitationCount(supabase, user.id),
      getUnreadMessageCount(supabase, user.id),
      getNavJobsUnreadCount(supabase, user.id),
    ]);
    navCounts = { pendingInvitations, unreadMessages, unreadJobs };
  }

  return (
    <NavCountsProvider {...navCounts} enablePolling={Boolean(user)}>
      <CurrentUserProvider
        user={
          user
            ? {
                id: user.id,
                avatarUrl: user.avatarUrl,
                initials: user.initials,
                fullName: user.fullName,
                isAdmin: user.isAdmin,
              }
            : null
        }
      >
        {user ? (
          <MessagingDockShell>
            <MobileShellEffects />
            {children}
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          </MessagingDockShell>
        ) : (
          <>
            <MobileShellEffects />
            {children}
          </>
        )}
        <InstallPwaHint />
      </CurrentUserProvider>
    </NavCountsProvider>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const dir = getDirection(locale);
  const appEnv = getAppEnvironment();
  const t = createT(messages);
  const showDevBanner = isDevLikeApp();

  return (
    <html lang={locale} dir={dir} data-app-env={appEnv} className={`${rubik.variable} scroll-smooth`}>
      <body className="min-h-screen overflow-x-clip antialiased">
        {showDevBanner ? (
          <DevEnvironmentBanner
            variant={appEnv === "preview" ? "preview" : "development"}
            label={
              appEnv === "preview" ? t("dev.previewBanner") : t("dev.banner")
            }
          />
        ) : null}
        <LocaleProvider locale={locale} messages={messages}>
          <Suspense fallback={null}>
            <RootUserShell>{children}</RootUserShell>
          </Suspense>
        </LocaleProvider>
      </body>
    </html>
  );
}
