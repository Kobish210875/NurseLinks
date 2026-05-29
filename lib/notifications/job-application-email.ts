import type { Locale } from "@/lib/i18n/config";

type SendJobApplicationEmailArgs = {
  locale: Locale;
  toEmail: string;
  posterName: string;
  applicantName: string;
  applicantPhone: string;
  jobTitle: string;
  hasCv: boolean;
};

export async function sendJobApplicationNotificationEmail(args: SendJobApplicationEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !fromEmail) {
    return { skipped: true as const, reason: "missing-config" as const };
  }

  const applicationsUrl = `${appUrl.replace(/\/$/, "")}/jobs?view=applications`;
  const isHe = args.locale === "he";
  const subject = isHe
    ? `מועמדות חדשה: ${args.jobTitle}`
    : `New application: ${args.jobTitle}`;
  const cvLine = args.hasCv
    ? isHe
      ? "צורפו קורות חיים — ניתן להוריד בטאב «מועמדויות»."
      : "A resume was attached — download it from the Applications tab."
    : isHe
      ? "לא צורפו קורות חיים."
      : "No resume was attached.";
  const html = isHe
    ? `
    <div style="font-family:Arial,sans-serif;line-height:1.6;direction:rtl;text-align:right">
      <p>שלום ${args.posterName || ""},</p>
      <p><strong>${args.applicantName}</strong> הגיש/ה מועמדות למשרה <strong>${args.jobTitle}</strong>.</p>
      <p>טלפון: <strong dir="ltr">${args.applicantPhone}</strong></p>
      <p>${cvLine}</p>
      <p><a href="${applicationsUrl}">פתיחת מועמדויות במשרות</a></p>
    </div>
  `
    : `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <p>Hi ${args.posterName || "there"},</p>
      <p><strong>${args.applicantName}</strong> applied for <strong>${args.jobTitle}</strong>.</p>
      <p>Phone: <strong>${args.applicantPhone}</strong></p>
      <p>${cvLine}</p>
      <p><a href="${applicationsUrl}">Open applications in Jobs</a></p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [args.toEmail],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    return { skipped: false as const, ok: false as const };
  }

  return { skipped: false as const, ok: true as const };
}
