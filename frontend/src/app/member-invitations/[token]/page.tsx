import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { InvitationAcceptance } from "@/components/members/invitation-acceptance";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { getPublicInvitation, MemberInvitationError } from "@/modules/memberships/invitation-service";
import { tokenSchema } from "@/modules/memberships/invitation-schema";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function MemberInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenSchema.safeParse(token).success) notFound();
  let invitation;
  try { invitation = await getPublicInvitation(token); }
  catch (error) { if (error instanceof MemberInvitationError) notFound(); throw error; }
  let signedIn = false;
  try { const store = await cookies(); await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value); signedIn = true; }
  catch (error) { if (!(error instanceof UnauthenticatedError)) throw error; }
  return <main className="foundation-page"><header className="foundation-header"><a className="brand" href="/">♡ <span>Make My <b>Marriage</b></span></a></header><section className="onboarding-wrap invite-page"><div className="onboarding-heading"><p className="foundation-eyebrow">WEDDING MEMBER INVITATION</p><h1>Plan this celebration together</h1><p>{invitation.wedding.brideName} &amp; {invitation.wedding.groomName} · {invitation.wedding.weddingDate}</p></div><article className="onboarding-card"><InvitationAcceptance token={token} email={invitation.email} role={invitation.role} signedIn={signedIn} /></article></section><footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer></main>;
}
