import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { SignOutButton } from "@/components/foundation/sign-out-button";
import { WorkspaceNavigation } from "@/components/foundation/workspace-navigation";
import { getWeddingTaskSummary } from "@/modules/tasks/task-service";

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
  const [events, taskSummary] = await Promise.all([listWeddingEvents(current.user.id), getWeddingTaskSummary(current.user.id, wedding.timeZone)]);
  const params = await searchParams;

  return (
    <main className="foundation-page">
      <header className="foundation-header">
        <a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a>
        <div className="onboarding-help"><span>Your account · {current.user.name}</span> <SignOutButton /></div>
      </header>
      <WorkspaceNavigation active="overview" role={current.membership?.role ?? "VIEWER"} />
      <section className="onboarding-wrap">
        <div className="onboarding-heading"><p className="foundation-eyebrow">YOUR WEDDING WORKSPACE</p><h1>{wedding.title}</h1><p>Your wedding workspace is saved and ready for the next planning steps.</p></div>
        <article className="onboarding-card dashboard-wedding-card">
          <div className="dashboard-card-heading"><p className="foundation-eyebrow">WEDDING OVERVIEW</p><div className="dashboard-actions">{current.membership?.role !== "VIEWER" && <a className="button button-outline dashboard-edit-link" href="/wedding/edit">Edit details</a>}{current.membership?.role === "ADMIN" && <a className="button button-outline dashboard-edit-link" href="/members">Members</a>}</div></div>
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
        <article className="onboarding-card dashboard-events-card"><div className="dashboard-card-heading"><div><p className="foundation-eyebrow">YOUR CELEBRATIONS</p><h2>Wedding events</h2></div><div className="dashboard-actions"><span className="event-count">{events.length} saved</span><a className="button button-outline dashboard-edit-link" href="/events">Manage events</a></div></div>{events.length ? <ul className="saved-event-list">{events.map((event) => <li key={event.id}><span><strong>{event.name}</strong><small>{event.type}</small></span><time dateTime={event.startsAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: wedding.timeZone }).format(new Date(event.startsAt))}</time></li>)}</ul> : <p className="empty-invites">No events saved yet.</p>}</article>
        <article className="onboarding-card dashboard-tasks-card"><div className="dashboard-card-heading"><div><p className="foundation-eyebrow">PLANNING PROGRESS</p><h2>Wedding tasks</h2></div><div className="dashboard-actions"><span className="event-count">{taskSummary.completed} of {taskSummary.total} complete</span><a className="button button-outline dashboard-edit-link" href="/tasks">Manage tasks</a></div></div><div className="task-progress-track" role="progressbar" aria-label="Wedding tasks completed" aria-valuemin={0} aria-valuemax={taskSummary.total || 1} aria-valuenow={taskSummary.completed}><span style={{ width: `${taskSummary.total ? Math.round(taskSummary.completed / taskSummary.total * 100) : 0}%` }} /></div><p className="task-progress-caption">{taskSummary.total ? `${taskSummary.total - taskSummary.completed} tasks still to do` : "Create your first task to start planning together."}</p>{taskSummary.upcoming.length ? <><h3 className="upcoming-task-title">Coming up</h3><ul className="saved-event-list upcoming-task-list">{taskSummary.upcoming.map((task) => <li key={task.id}><span><strong>{task.title}</strong><small>{task.assignee?.name ?? "Unassigned"}{task.event ? ` · ${task.event.name}` : ""}</small></span><time dateTime={task.dueDate ?? undefined}>{task.dueDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: wedding.timeZone }).format(new Date(task.dueDate)) : "No due date"}</time></li>)}</ul></> : taskSummary.total > 0 && <p className="empty-invites">No upcoming due dates.</p>}</article>
      <p className="prototype-banner"><span aria-hidden="true">✿</span> Wedding details, events, tasks, and members are ready to plan together.</p>
      </section>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
