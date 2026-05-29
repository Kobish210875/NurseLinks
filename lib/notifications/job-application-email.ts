import type { Locale } from "@/lib/i18n/config";

type SendJobApplicationEmailArgs = {
  locale: Locale;
  toEmail: string;
  posterName: string;
  applicantName: string;
  jobTitle: string;
  hasCv: boolean;
};

export async function sendJobApplicationNotificationEmail(args: SendJobApplicationEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !fromEmail) {
    return { skipped: true as const };
  }

  const applicationsUrl = `${appUrl.replace(/\/$/, "")}/jobs?view=applications`;
  const isHe = args.locale === "he";
  const subject = isHe
    ? `מועמדות חדשה למשרה: ${args.jobTitle}`
    : `New application for: ${args.jobTitle}`;
  const cvLine = args.hasCv
    ? isHe
      ? "צורפו קורות חיים."
      : "A resume file was attached."
    : isHe
      ? "לא צורפו קורות חיים."
      : "No resume file was attached.";
  const html = isHe
    ? `
    <div style="font-family:Arial,sans-serif;line-height:1.6;direction:rtl;text-align:right">
      <p>שלום ${args.posterName || ""},</p>
      <p><strong>${args.applicantName}</strong> הגיש/ה מועמדות למשרה <strong>${args.jobTitle}</strong>.</p>
      <p>${cvLine}</p>
      <p><a href="${applicationsUrl}">צפייה במועמדויות</a></p>
    </div>
  `
    : `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <p>Hi ${args.posterName || "there"},</p>
      <p><strong>${args.applicantName}</strong> applied for <strong>${args.jobTitle}</strong>.</p>
      <p>${cvLine}</p>
      <p><a href="${applicationsUrl}">View applications</a></p>
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
