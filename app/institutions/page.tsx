import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import MobileInstitutionsContent from "@/components/hospitals/MobileInstitutionsContent";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstitutionActivityForUser } from "@/lib/data/institution-activity";
import { getInstitutionDetailsMap } from "@/lib/data/institution-details";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

async function InstitutionsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const supabase = await createClient();
  const [institutionActivity, detailsMap] = await Promise.all([
    getInstitutionActivityForUser(supabase, user.id),
    getInstitutionDetailsMap(supabase, user.id, locale, t("profile.institutionOther")),
  ]);
  return (
    <MobileInstitutionsContent
      activity={institutionActivity}
      detailsMap={detailsMap}
      defaultApplicantName={user.fullName}
    />
  );
}

export default function InstitutionsPage() {
  return (
    <>
      <Navbar authenticated />
      <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0 md:hidden">
        <main className="home-main-shell feed-page min-h-0 flex-1 max-md:block max-md:flex-none">
          <div className="mx-auto w-full min-w-0 max-w-[1240px] px-3 py-3 sm:px-4">
            <Suspense
              fallback={
                <div className="feed-card h-[min(70vh,32rem)] motion-safe:animate-pulse" aria-hidden="true" />
              }
            >
              <InstitutionsPageContent />
            </Suspense>
            <div className="mobile-feed-bottom-spacer" aria-hidden="true" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
