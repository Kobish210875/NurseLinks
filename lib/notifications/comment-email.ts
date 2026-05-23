type SendCommentEmailArgs = {
  toEmail: string;
  recipientName: string;
  commenterName: string;
  commentBody: string;
  postPreview: string;
  postId: string;
};

function trimPreview(text: string, max = 160) {
  const v = text.trim();
  if (v.length <= max) {
    return v;
  }
  return `${v.slice(0, max - 1)}…`;
}

export async function sendCommentNotificationEmail(args: SendCommentEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !fromEmail) {
    return { skipped: true as const };
  }

  const postUrl = `${appUrl.replace(/\/$/, "")}/home#post-${args.postId}`;
  const subject = "New comment on your post";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <p>Hi ${args.recipientName || "there"},</p>
      <p><strong>${args.commenterName}</strong> commented on your post.</p>
      <p style="background:#f7f7f7;padding:10px;border-radius:8px;">
        ${trimPreview(args.commentBody)}
      </p>
      <p><strong>Your post:</strong> ${trimPreview(args.postPreview)}</p>
      <p><a href="${postUrl}">Open post</a></p>
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
