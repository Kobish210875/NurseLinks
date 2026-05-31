import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Suspense } from "react";
import DevEnvironmentBanner from "@/components/dev/DevEnvironmentBanner";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CurrentUserProvider } from "@/components/nav/CurrentUserProvider";
import MobileBottomNav from "@/components/nav/MobileBottomNav";
import MobileShellEffects from "@/components/nav/MobileShellEffects";
import { NavCountsProvider } from "@/components/nav/NavCountsProvider";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAppEnvironment } from "@/lib/env/app-environment";
import { getPendingInvitationCount } from "@/lib/data/connections";
import { getNavJobsUnreadCount } from "@/lib/data/jobs";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { getDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const dir = getDirection(locale);
  const appEnv = getAppEnvironment();
  const showDevBanner = appEnv === "development";

  const user = await getCurrentUser();
  let pendingInvitations = 0;
  let unreadMessages = 0;
  let unreadJobs = 0;
  if (user) {
    const supabase = await createClient();
    [pendingInvitations, unreadMessages, unreadJobs] = await Promise.all([
      getPendingInvitationCount(supabase, user.id),
      getUnreadMessageCount(supabase, user.id),
      getNavJobsUnreadCount(supabase, user.id),
    ]);
  }

  return (
    <html lang={locale} dir={dir} data-app-env={appEnv} className={`${rubik.variable} scroll-smooth`}>
      <body className="min-h-screen overflow-x-clip antialiased">
        <LocaleProvider locale={locale} messages={messages}>
          {showDevBanner ? <DevEnvironmentBanner /> : null}
          <NavCountsProvider
            pendingInvitations={pendingInvitations}
            unreadMessages={unreadMessages}
            unreadJobs={unreadJobs}
          >
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
              <MobileShellEffects />
              {children}
              {user ? (
                <Suspense fallback={null}>
                  <MobileBottomNav />
                </Suspense>
              ) : null}
            </CurrentUserProvider>
          </NavCountsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
