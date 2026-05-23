import JobComposer from "@/components/jobs/JobComposer";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

export default async function JobsPublishPage() {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <section className="space-y-3">
      <h2 className="text-start text-sm font-semibold text-foreground">{t("jobs.publishPageTitle")}</h2>
      <JobComposer />
    </section>
  );
}
