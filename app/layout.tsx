import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { NavCountsProvider } from "@/components/nav/NavCountsProvider";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPendingInvitationCount } from "@/lib/data/connections";
import { getNavJobsUnreadCount } from "@/lib/data/jobs";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { getDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return {
    title: "NurseLinks",
    description: t("meta.description"),
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
    <html lang={locale} dir={dir} className={`${rubik.variable} scroll-smooth`}>
      <body className="min-h-screen overflow-x-clip antialiased">
        <LocaleProvider locale={locale} messages={messages}>
          <NavCountsProvider
            pendingInvitations={pendingInvitations}
            unreadMessages={unreadMessages}
            unreadJobs={unreadJobs}
          >
            {children}
          </NavCountsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
