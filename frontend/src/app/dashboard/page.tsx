import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { SignOutButton } from "@/components/foundation/sign-out-button";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  let current;
  try {
    const cookieStore = await cookies();
    current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  const wedding = await getWeddingForUser(current.user.id);
  if (!wedding) redirect("/onboarding");
  const events = await listWeddingEvents(current.user.id);
  const params = await searchParams;

  return (
    <main className="foundation-page">
      <header className="foundation-header">
        <a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a>
        <div className="onboarding-help"><span>Your account · {current.user.name}</span> <SignOutButton /></div>
      </header>
      <section className="onboarding-wrap">
        <div className="onboarding-heading"><p className="foundation-eyebrow">YOUR WEDDING WORKSPACE</p><h1>{wedding.title}</h1><p>Your wedding workspace is saved and ready for the next planning steps.</p></div>
        <article className="onboarding-card dashboard-wedding-card">
          <div className="dashboard-card-heading"><p className="foundation-eyebrow">WEDDING OVERVIEW</p><div className="dashboard-actions"><a className="button button-outline dashboard-edit-link" href="/wedding/edit">Edit details</a>{current.membership?.role === "ADMIN" && <a className="button button-outline dashboard-edit-link" href="/members">Members</a>}</div></div>
          {params.updated === "1" && <p className="dashboard-saved-message" role="status">Your wedding details have been saved.</p>}
          <h2>{wedding.brideName} &amp; {wedding.groomName}</h2>
          <dl className="dashboard-wedding-details">
            <div><dt>Wedding date</dt><dd>{wedding.weddingDate}</dd></div>
            <div><dt>Location</dt><dd>{wedding.location.formattedAddress}</dd></div>
            <div><dt>Time zone</dt><dd>{wedding.timeZone}</dd></div>
            <div><dt>Your role</dt><dd>{wedding.role}</dd></div>
            <div><dt>Wedding page</dt><dd>/{wedding.website.slug}</dd></div>
          </dl>
          {wedding.description && <p className="onboarding-description">{wedding.description}</p>}
        </article>
        <article className="onboarding-card dashboard-events-card"><div className="dashboard-card-heading"><div><p className="foundation-eyebrow">YOUR CELEBRATIONS</p><h2>Wedding events</h2></div><span className="event-count">{events.length} saved</span></div>{events.length ? <ul className="saved-event-list">{events.map((event) => <li key={event.id}><span><strong>{event.name}</strong><small>{event.type}</small></span><time dateTime={event.startsAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: wedding.timeZone }).format(new Date(event.startsAt))}</time></li>)}</ul> : <p className="empty-invites">No events saved yet.</p>}</article>
        <p className="prototype-banner"><span aria-hidden="true">✿</span> Wedding details, saved events, and wedding members are ready to plan together.</p>
      </section>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
