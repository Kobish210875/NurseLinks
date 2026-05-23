import Link from "next/link";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

export default async function Footer() {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <footer className="site-footer mt-auto border-t border-border bg-white py-5">
      <div className="mx-auto max-w-[1128px] px-4">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Link href="/" className="shrink-0 text-base font-bold text-primary" aria-label="NurseLinks">
            <NurseLinkWordmark textClassName="text-primary" />
          </Link>
          <span className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
          <p className="text-center text-xs text-muted-foreground sm:text-start">
            {t("footer.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
