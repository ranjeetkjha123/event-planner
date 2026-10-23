import { SignOutButton } from "@/components/foundation/sign-out-button";

type DashboardEvent = {
  id: string;
  name: string;
  startsAt: string;
  venueName: string;
  address: string;
};

type DashboardTask = {
  id: string;
  title: string;
  dueDate: string | null;
  assignee: { name: string } | null;
  event: { name: string } | null;
};

type WeddingDashboardProps = {
  wedding: {
    brideName: string;
    groomName: string;
    role: string;
    weddingDate: string;
    timeZone: string;
    location: { formattedAddress: string };
  };
  userName: string;
  events: DashboardEvent[];
  taskSummary: { total: number; completed: number; upcoming: DashboardTask[] };
  savedMessage: boolean;
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "▦", active: true },
  { label: "Events", href: "/events", icon: "◷" },
  { label: "Guests", href: "/guests", icon: "♧" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Shopping", icon: "◇", soon: true },
  { label: "Expenses", icon: "₹", soon: true },
  { label: "Vendors", icon: "✳", soon: true },
  { label: "Invitations", icon: "✉", soon: true },
  { label: "Gallery", icon: "▧", soon: true },
  { label: "Website", icon: "⌂", soon: true },
] as const;

function weddingDayCount(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const todayParts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const today = Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day));
  return Math.round((Date.UTC(year, month - 1, day) - today) / 86_400_000);
}

function greeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Sidebar({ role }: { role: string }) {
  return <aside className="wedding-sidebar">
    <a className="wedding-sidebar-brand" href="/" aria-label="Make My Marriage home"><span aria-hidden="true">♡</span><span>Make My Marriage</span></a>
    <nav className="wedding-sidebar-nav" aria-label="Wedding planning">
      {navigation.map((item) => {
        const active = "active" in item && item.active;
        const className = `wedding-sidebar-link${active ? " is-active" : ""}${"soon" in item && item.soon ? " is-coming" : ""}`;
        return "href" in item ? <a className={className} href={item.href} aria-current={active ? "page" : undefined} key={item.label}><span className="wedding-sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></a> :
          <span className={className} aria-disabled="true" key={item.label} title="This planning area is not available yet"><span className="wedding-sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><small>Soon</small></span>;
      })}
    </nav>
    <div className="wedding-sidebar-bottom">
      {role === "ADMIN" && <a className="wedding-sidebar-link" href="/members"><span className="wedding-sidebar-icon" aria-hidden="true">⚙</span><span>Members &amp; settings</span></a>}
      {role === "MANAGER" && <a className="wedding-sidebar-link" href="/wedding/edit"><span className="wedding-sidebar-icon" aria-hidden="true">⚙</span><span>Wedding settings</span></a>}
      {role === "VIEWER" && <span className="wedding-sidebar-role">Read only · Viewer</span>}
    </div>
  </aside>;
}

function weddingDateLabel(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function eventDate(date: string, timeZone: string) {
  const value = new Date(date);
  return {
    month: new Intl.DateTimeFormat("en", { month: "short", timeZone }).format(value).toUpperCase(),
    day: new Intl.DateTimeFormat("en", { day: "2-digit", timeZone }).format(value),
    details: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone }).format(value),
  };
}

export function WeddingDashboard({ wedding, userName, events, taskSummary, savedMessage }: WeddingDashboardProps) {
  const days = weddingDayCount(wedding.weddingDate, wedding.timeZone);
  const upcomingEvents = events.filter((event) => new Date(event.startsAt).getTime() >= Date.now()).slice(0, 4);
  const remainingTasks = Math.max(0, taskSummary.total - taskSummary.completed);
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return <div className="wedding-dashboard-shell">
    <Sidebar role={wedding.role} />
    <main className="wedding-dashboard-main">
      <header className="wedding-dashboard-topbar"><div className="wedding-dashboard-couple-label">{wedding.brideName} &amp; {wedding.groomName}<span>{wedding.role}</span></div><div className="wedding-dashboard-account"><span>{userName}</span><span className="wedding-dashboard-avatar" aria-hidden="true">{initial}</span><SignOutButton /></div></header>
      <div className="wedding-dashboard-content">
        {savedMessage && <p className="dashboard-saved-message" role="status">Your wedding details have been saved.</p>}
        <div className="wedding-dashboard-intro"><div><p className="foundation-eyebrow">YOUR WEDDING WORKSPACE</p><h1>{greeting(wedding.timeZone)}, {wedding.brideName} &amp; {wedding.groomName} <span aria-hidden="true">✿</span></h1><p>Your celebration is taking shape. Here’s your planning overview.</p></div>{wedding.role !== "VIEWER" && <a className="button button-outline dashboard-edit-link" href="/wedding/edit">Edit wedding</a>}</div>
        <section className="wedding-countdown-card" aria-label="Wedding date countdown"><div><p className="dashboard-section-label">YOUR WEDDING DAY</p><strong>{weddingDateLabel(wedding.weddingDate)}{wedding.location.formattedAddress ? ` · ${wedding.location.formattedAddress}` : ""}</strong></div><div className="wedding-countdown-number"><strong>{Math.abs(days)}</strong><span>{days < 0 ? "days since" : days === 0 ? "today" : "days to go"}</span></div></section>
        <section className="wedding-dashboard-metrics" aria-label="Wedding planning summary">
          <article className="wedding-metric-card"><span>EVENTS</span><strong>{events.length}</strong><small>{events.length === 1 ? "celebration" : "celebrations"}</small></article>
          <a className="wedding-metric-card metric-unavailable" href="/guests"><span>GUESTS</span><strong>—</strong><small>Manage guest list</small></a>
          <article className="wedding-metric-card metric-unavailable"><span>CONFIRMED</span><strong>—</strong><small>RSVP tracking coming soon</small></article>
          <article className="wedding-metric-card metric-unavailable"><span>EXPENSES</span><strong>—</strong><small>Expense tracking coming soon</small></article>
          <article className="wedding-metric-card"><span>TASKS</span><strong>{remainingTasks}</strong><small>to complete · {taskSummary.completed} done</small></article>
        </section>
        <div className="wedding-dashboard-panels">
          <section className="wedding-dashboard-panel" aria-labelledby="upcoming-events-title"><div className="wedding-dashboard-panel-heading"><h2 id="upcoming-events-title">Upcoming events</h2><a href="/events">View all <span aria-hidden="true">→</span></a></div>
            {upcomingEvents.length ? <ul className="dashboard-upcoming-events">{upcomingEvents.map((event) => { const date = eventDate(event.startsAt, wedding.timeZone); return <li key={event.id}><time><span>{date.month}</span><strong>{date.day}</strong></time><span className="dashboard-event-copy"><strong>{event.name}</strong><small>{[event.venueName, event.address, date.details].filter(Boolean).join(" · ")}</small></span><span className="dashboard-event-status">Planned</span></li>; })}</ul> : <div className="dashboard-empty-state"><p>No upcoming events yet.</p><a href="/events">Plan an event</a></div>}
          </section>
          <section className="wedding-dashboard-panel dashboard-task-panel" aria-labelledby="task-overview-title"><div className="wedding-dashboard-panel-heading"><h2 id="task-overview-title">Task overview</h2><a href="/tasks">Manage <span aria-hidden="true">→</span></a></div>
            <div className="dashboard-task-count"><strong>{taskSummary.completed}<span> / {taskSummary.total}</span></strong><small>tasks complete</small></div><div className="task-progress-track" role="progressbar" aria-label="Wedding tasks completed" aria-valuemin={0} aria-valuemax={taskSummary.total || 1} aria-valuenow={taskSummary.completed}><span style={{ width: `${taskSummary.total ? Math.round(taskSummary.completed / taskSummary.total * 100) : 0}%` }} /></div><p className="dashboard-task-caption">{remainingTasks ? `${remainingTasks} tasks still to do` : taskSummary.total ? "All tasks are complete." : "Create your first task to get started."}</p>
            {taskSummary.upcoming.length > 0 && <><h3 className="dashboard-next-tasks-title">Coming up</h3><ul className="dashboard-next-tasks">{taskSummary.upcoming.slice(0, 3).map((task) => <li key={task.id}><span><strong>{task.title}</strong><small>{task.assignee?.name ?? "Unassigned"}{task.event ? ` · ${task.event.name}` : ""}</small></span><time dateTime={task.dueDate ?? undefined}>{task.dueDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: wedding.timeZone }).format(new Date(task.dueDate)) : "No due date"}</time></li>)}</ul></>}
          </section>
        </div>
        <p className="wedding-dashboard-note">RSVP and expense details will appear here when those planning areas are available.</p>
      </div>
    </main>
  </div>;
}
