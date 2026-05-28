import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import InstitutionPage from "@/components/hospitals/InstitutionPage";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getColleaguesAtInstitution } from "@/lib/data/institution-colleagues";
import { getInstitutionOpenJobs } from "@/lib/data/institution-jobs";
import {
  INSTITUTION_REGIONS,
  getInstitutionBySlug,
} from "@/lib/data/medical-institutions";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type HospitalPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HospitalDetailPage({ params }: HospitalPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { slug } = await params;
  const institution = getInstitutionBySlug(slug);
  if (!institution) {
    redirect("/home");
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const supabase = await createClient();
  const colleagues = await getColleaguesAtInstitution(
    supabase,
    user.id,
    institution,
    t("profile.institutionOther"),
  );
  const openJobs = await getInstitutionOpenJobs(supabase, institution.slug, locale);

  const regionMeta = INSTITUTION_REGIONS.find((r) => r.id === institution.region);
  const regionLabel = regionMeta ? t(regionMeta.labelKey) : "";

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-[calc(100vh-4rem)] py-4 md:py-6">
        <div className="mx-auto max-w-2xl px-4">
          <InstitutionPage
            institution={institution}
            colleagues={colleagues}
            openJobs={openJobs}
            defaultApplicantName={user.fullName}
            regionLabel={regionLabel}
            labels={{
              back: t("hospitals.back"),
              colleaguesTitle: t("hospitals.colleaguesTitle"),
              colleaguesEmpty: t("hospitals.colleaguesEmpty"),
              colleaguesHint: t("hospitals.colleaguesHint"),
              message: t("network.message"),
              jobsTitle: t("hospitals.jobsTitle"),
              jobsHint: t("hospitals.jobsHint"),
              jobsEmpty: t("hospitals.jobsEmpty"),
              jobsOpenAll: t("hospitals.jobsOpenAll"),
              jobsLocation: t("jobs.jobLocation"),
              apply: t("jobs.apply"),
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
