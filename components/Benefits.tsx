import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

export default async function Benefits() {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  const benefits = [
    {
      title: t("benefits.card1Title"),
      description: t("benefits.card1Desc"),
      icon: (
        <>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
    {
      title: t("benefits.card2Title"),
      description: t("benefits.card2Desc"),
      icon: (
        <>
          <path d="M12 12h.01" />
          <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M22 13a18.15 18.15 0 0 1-20 0" />
          <rect width="20" height="14" x="2" y="6" rx="2" />
        </>
      ),
    },
    {
      title: t("benefits.card3Title"),
      description: t("benefits.card3Desc"),
      icon: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
  ];

  return (
    <section
      id="about"
      className="relative border-t border-border bg-gradient-to-b from-white to-muted/50 py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            {t("benefits.eyebrow")}
          </p>
          <h2 className="mb-4 flex flex-wrap items-baseline justify-center gap-x-2 text-3xl font-bold text-foreground md:text-4xl">
            <span>{t("benefits.titlePrefix")}</span>
            <span className="text-gradient-brand text-4xl md:text-5xl">
              <NurseLinkWordmark textClassName="text-inherit" />
            </span>
            <span>{t("benefits.titleSuffix")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">{t("benefits.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className="benefit-card group relative overflow-hidden rounded-2xl p-8"
            >
              <span
                className="absolute top-0 end-0 start-0 h-1 bg-gradient-to-r from-accent via-primary to-primary-dark"
                aria-hidden="true"
              />
              <span className="mb-5 block text-4xl font-bold text-primary/15 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 transition-transform group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                  aria-hidden="true"
                >
                  {benefit.icon}
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">{benefit.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
