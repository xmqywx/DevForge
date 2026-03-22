import { createTransport } from "nodemailer";

const transporter = process.env.SMTP_HOST
  ? createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendFeedbackNotification(
  fb: { id: number; title: string; type: string; description: string; authorName: string | null },
  projectName: string
) {
  if (!transporter || !process.env.NOTIFICATION_EMAIL) return;
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "DevForge <noreply@devforge.dev>",
    to: process.env.NOTIFICATION_EMAIL,
    subject: `[DevForge] New ${fb.type}: ${fb.title} — ${projectName}`,
    html: `<h2>New Feedback on ${projectName}</h2><p><strong>Type:</strong> ${fb.type}</p><p><strong>From:</strong> ${fb.authorName ?? "匿名"}</p><p><strong>Title:</strong> ${fb.title}</p><hr><p>${fb.description}</p>`,
  });
}
