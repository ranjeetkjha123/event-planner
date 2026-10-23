import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GuestManager } from "@/components/guests/guest-manager";
import { WorkspaceNavigation } from "@/components/foundation/workspace-navigation";
import { SignOutButton } from "@/components/foundation/sign-out-button";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { listWeddingGuests } from "@/modules/guests/guest-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function GuestsPage() {
  let current;
  try {
    current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  const [wedding, guests, events] = await Promise.all([
    getWeddingForUser(current.user.id),
    listWeddingGuests(current.user.id, { page: 1, limit: 20 }),
    listWeddingEvents(current.user.id),
  ]);
  if (!wedding) redirect("/onboarding");

  return <main className="foundation-page">
    <header className="foundation-header"><a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a><div className="onboarding-help">{current.user.name} <SignOutButton /></div></header>
    <WorkspaceNavigation active="guests" role={current.membership?.role ?? "VIEWER"} />
    <section className="onboarding-wrap task-page-wrap">
      <div className="onboarding-heading"><p className="foundation-eyebrow">{wedding.brideName} &amp; {wedding.groomName}</p><h1>Wedding guests</h1><p>Organize households, contact details, and which celebrations they are invited to.</p></div>
      <article className="onboarding-card task-management-card"><GuestManager initialGuests={guests.data} pagination={guests.pagination} events={events.map((event) => ({ id: event.id, name: event.name }))} canEdit={current.membership?.role !== "VIEWER"} /></article>
      <p className="prototype-banner"><span aria-hidden="true">✿</span> Guest records are saved in this wedding workspace. Invitation delivery and guest RSVP links are the next guest-management increment.</p>
    </section>
    <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
  </main>;
}
