import "server-only";

import { getServerEnv } from "@/config/env";

export async function sendMemberInvitationEmail(input: { to: string; weddingName: string; role: string; inviteUrl: string }) {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) throw new Error("Email delivery is not configured.");
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  const weddingName = escapeHtml(input.weddingName);
  const inviteUrl = escapeHtml(input.inviteUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [input.to],
      subject: `You're invited to help plan ${input.weddingName}`,
      html: `<p>You have been invited as a ${escapeHtml(input.role.toLowerCase())} to help plan ${weddingName}.</p><p><a href="${inviteUrl}">Review and accept your invitation</a></p><p>This link expires in 7 days. If you were not expecting this invitation, you can ignore this email.</p>`,
      text: `You have been invited as a ${input.role.toLowerCase()} to help plan ${input.weddingName}. Review and accept: ${input.inviteUrl}\n\nThis link expires in 7 days.`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Invitation email delivery failed.");
}
