import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EventManager } from "@/components/events/event-manager";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { SignOutButton } from "@/components/foundation/sign-out-button";
import { WorkspaceNavigation } from "@/components/foundation/workspace-navigation";

export default async function EventsPage() {
  let current;
  try {
    const store = await cookies();
    current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  const [wedding, events] = await Promise.all([getWeddingForUser(current.user.id), listWeddingEvents(current.user.id)]);
  if (!wedding) redirect("/onboarding");

  return <main className="foundation-page">
    <header className="foundation-header"><a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a><div className="onboarding-help">{current.user.name} <SignOutButton /></div></header>
    <WorkspaceNavigation active="events" role={current.membership?.role ?? "VIEWER"} />
    <section className="onboarding-wrap">
      <div className="onboarding-heading"><p className="foundation-eyebrow">YOUR WEDDING WORKSPACE</p><h1>Wedding events</h1><p>Keep celebration details and timings up to date.</p></div>
      <article className="onboarding-card wedding-edit-card"><div className="dashboard-card-heading"><div><p className="foundation-eyebrow">EVENTS &amp; TRADITIONS</p><h2>Active events</h2></div></div><p className="onboarding-description">Times are shown in {wedding.timeZone}. Archiving keeps existing event references intact.</p><EventManager initialEvents={events} timeZone={wedding.timeZone} canEdit={current.membership?.role !== "VIEWER"} /></article>
      <p className="prototype-banner"><span aria-hidden="true">✿</span> Changes are saved to your wedding workspace.</p>
    </section>
    <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
  </main>;
}
