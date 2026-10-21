import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MemberManagement } from "@/components/members/member-management";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { listPendingInvitations, listWeddingMembers } from "@/modules/memberships/invitation-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function MembersPage() {
  let current;
  try { const store = await cookies(); current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value); }
  catch (error) { if (error instanceof UnauthenticatedError) redirect("/login"); throw error; }
  if (!current.wedding) redirect("/onboarding");
  if (current.membership?.role !== "ADMIN") redirect("/dashboard");
  const [members, invitations] = await Promise.all([listWeddingMembers(current.wedding.id), listPendingInvitations(current.wedding.id)]);
  return <main className="foundation-page"><header className="foundation-header"><a className="brand" href="/">♡ <span>Make My <b>Marriage</b></span></a><div className="onboarding-help">Your account · {current.user.name}</div></header><section className="onboarding-wrap"><div className="onboarding-heading"><p className="foundation-eyebrow">WORKSPACE SETTINGS</p><h1>Wedding members</h1><p>Invite family and friends to plan this wedding with you.</p></div><article className="onboarding-card member-management-card"><MemberManagement members={members} invitations={invitations}/></article><div className="onboarding-actions"><a className="text-button" href="/dashboard">← Back to wedding workspace</a></div></section><footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer></main>;
}
