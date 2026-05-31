import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CurrentUserProvider } from "@/components/nav/CurrentUserProvider";
import MobileBottomNav from "@/components/nav/MobileBottomNav";
import MobileShellEffects from "@/components/nav/MobileShellEffects";
import NavCountsLoader from "@/components/nav/NavCountsLoader";
import { NavCountsProvider } from "@/components/nav/NavCountsProvider";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAppEnvironment } from "@/lib/env/app-environment";
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

function NavCountsFallback({ children }: { children: React.ReactNode }) {
  return (
    <NavCountsProvider pendingInvitations={0} unreadMessages={0} unreadJobs={0}>
      {children}
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
  const user = await getCurrentUser();
  const appEnv = getAppEnvironment();

  const currentUserValue = user
    ? {
        id: user.id,
        avatarUrl: user.avatarUrl,
        initials: user.initials,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
      }
    : null;

  const shell = (
    <CurrentUserProvider user={currentUserValue}>
      <MobileShellEffects />
      {children}
      {user ? (
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      ) : null}
    </CurrentUserProvider>
  );

  return (
    <html lang={locale} dir={dir} data-app-env={appEnv} className={`${rubik.variable} scroll-smooth`}>
      <body className="min-h-screen overflow-x-clip antialiased">
        <LocaleProvider locale={locale} messages={messages}>
          {user ? (
            <Suspense fallback={<NavCountsFallback>{shell}</NavCountsFallback>}>
              <NavCountsLoader userId={user.id}>{shell}</NavCountsLoader>
            </Suspense>
          ) : (
            <NavCountsFallback>{shell}</NavCountsFallback>
          )}
        </LocaleProvider>
      </body>
    </html>
  );
}
