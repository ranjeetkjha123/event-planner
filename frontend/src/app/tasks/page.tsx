import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TaskManager } from "@/components/tasks/task-manager";
import { WorkspaceNavigation } from "@/components/foundation/workspace-navigation";
import { SignOutButton } from "@/components/foundation/sign-out-button";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { listWeddingTaskAssignees } from "@/modules/memberships/invitation-service";
import { listWeddingTasks } from "@/modules/tasks/task-service";
import type { ListTasksQuery } from "@/modules/tasks/task-schema";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function TasksPage() {
  let current;
  try {
    current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  const [wedding, initialResult, events, memberRows] = await Promise.all([
    getWeddingForUser(current.user.id),
    listWeddingTasks(current.user.id, { page: 1, limit: 50 } satisfies ListTasksQuery),
    listWeddingEvents(current.user.id),
    listWeddingTaskAssignees(current.wedding.id),
  ]);
  if (!wedding) redirect("/onboarding");
  const members = memberRows.map((member) => ({ membershipId: member.membershipId, user: { name: member.name }, role: member.role }));
  return <main className="foundation-page">
    <header className="foundation-header"><a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a><div className="onboarding-help">{current.user.name} <SignOutButton /></div></header>
    <WorkspaceNavigation active="tasks" role={current.membership?.role ?? "VIEWER"} />
    <section className="onboarding-wrap task-page-wrap">
      <div className="onboarding-heading"><p className="foundation-eyebrow">{wedding.brideName} &amp; {wedding.groomName}</p><h1>Plan the next steps</h1><p>Share the work, track what is done, and keep every celebration moving.</p></div>
      <article className="onboarding-card task-management-card"><TaskManager initialTasks={initialResult.data} members={members} events={events.map((event) => ({ id: event.id, name: event.name }))} timeZone={wedding.timeZone} canEdit={current.membership?.role !== "VIEWER"} /></article>
      <p className="prototype-banner"><span aria-hidden="true">✿</span> Tasks are saved in this wedding workspace and visible to its members.</p>
    </section>
    <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
  </main>;
}
