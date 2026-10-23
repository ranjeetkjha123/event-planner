"use client";

import { useState, type FormEvent } from "react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
type Task = {
  id: string; title: string; description: string; assignedMembershipId: string | null;
  assignee: { membershipId: string; name: string; role: string } | null;
  eventId: string | null; event: { id: string; name: string; archivedAt: string | null } | null;
  dueDate: string | null; priority: TaskPriority; status: TaskStatus; completedAt: string | null;
};
type Member = { membershipId: string; user: { name: string }; role: string };
type EventOption = { id: string; name: string };

function localMidnightIso(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const desired = Date.UTC(year!, month! - 1, day!);
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  let candidate = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    candidate += desired - Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  }
  return new Date(candidate).toISOString();
}

function localDate(isoDate: string | null, timeZone: string) {
  if (!isoDate) return "";
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(isoDate)).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dueDateLabel(value: string | null, timeZone: string) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone }).format(new Date(value));
}

async function apiJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Unable to save task. Please try again.");
  return body;
}

export function TaskManager({ initialTasks, members, events, timeZone, canEdit }: { initialTasks: Task[]; members: Member[]; events: EventOption[]; timeZone: string; canEdit: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"all" | "mine" | "completed">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh(viewOverride = view, pageOverride = page) {
    const params = new URLSearchParams({ page: String(pageOverride), limit: "50" });
    if (viewOverride === "mine") params.set("mine", "true");
    if (viewOverride === "completed") params.set("status", "COMPLETED");
    else if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (eventFilter) params.set("eventId", eventFilter);
    if (memberFilter) params.set("assignedMembershipId", memberFilter);
    const result = await apiJson(`/api/tasks?${params.toString()}`);
    setTasks(result.data);
    setPage(result.pagination.page);
    setTotalPages(result.pagination.totalPages || 1);
  }

  async function clearFilters() {
    setStatusFilter("");
    setPriorityFilter("");
    setEventFilter("");
    setMemberFilter("");
    setError("");
    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (view === "mine") params.set("mine", "true");
    if (view === "completed") params.set("status", "COMPLETED");
    try {
      const result = await apiJson(`/api/tasks?${params.toString()}`);
      setTasks(result.data);
      setPage(1);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load tasks."); }
  }

  async function saveForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const due = String(form.get("dueDate") ?? "");
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? "").trim() || null,
      assignedMembershipId: String(form.get("assignedMembershipId") ?? "") || null,
      eventId: String(form.get("eventId") ?? "") || null,
      dueDate: due ? localMidnightIso(due, timeZone) : null,
      priority: String(form.get("priority") ?? "MEDIUM"),
      status: String(form.get("status") ?? "TODO"),
    };
    try {
      await apiJson(editing ? `/api/tasks/${editing.id}` : "/api/tasks", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setEditing(null);
      setFormOpen(false);
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save task."); }
    finally { setBusy(false); }
  }

  async function changeStatus(task: Task, status: string) {
    setError("");
    try {
      await apiJson(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update task."); }
  }

  async function removeTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setError("");
    try {
      await apiJson(`/api/tasks/${task.id}`, { method: "DELETE" });
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete task."); }
  }

  function beginEdit(task: Task) {
    setError("");
    setEditing(task);
    setFormOpen(true);
  }

  function beginCreate() {
    setError("");
    setEditing(null);
    setFormOpen(true);
  }

  return <div className="task-manager">
    <div className="task-manager-heading"><div><p className="foundation-eyebrow">WEDDING PLANNING</p><h2>Wedding tasks</h2><p>Keep every next step clear, assigned, and on time.</p></div>{canEdit && <button className="button" type="button" onClick={formOpen ? () => { setFormOpen(false); setEditing(null); } : beginCreate}>{formOpen ? "Close form" : "Add task"}</button>}</div>
    {formOpen && canEdit && <form className="task-form" onSubmit={saveForm} key={editing?.id ?? "new-task"}>
      <div className="task-form-title"><div><p className="foundation-eyebrow">{editing ? "EDIT TASK" : "NEW TASK"}</p><h3>{editing ? "Update planning task" : "Add a planning task"}</h3></div></div>
      <label>Task title<input name="title" required maxLength={200} defaultValue={editing?.title ?? ""} placeholder="Confirm the photographer" /></label>
      <label>Description <span className="task-optional">Optional</span><textarea name="description" maxLength={2000} defaultValue={editing?.description ?? ""} rows={3} placeholder="Add useful details for the person handling this." /></label>
      <div className="task-form-grid">
        <label>Assign to<select name="assignedMembershipId" defaultValue={editing?.assignedMembershipId ?? ""}><option value="">Unassigned</option>{members.map((member) => <option key={member.membershipId} value={member.membershipId}>{member.user.name} · {member.role.toLowerCase()}</option>)}</select></label>
        <label>Wedding event<select name="eventId" defaultValue={editing?.eventId ?? ""}><option value="">General wedding task</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Due date<input name="dueDate" type="date" defaultValue={localDate(editing?.dueDate ?? null, timeZone)} /></label>
        <label>Priority<select name="priority" defaultValue={editing?.priority ?? "MEDIUM"}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
        <label>Status<select name="status" defaultValue={editing?.status ?? "TODO"}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></label>
      </div>
      {error && <p className="task-error" role="alert">{error}</p>}
      <div className="task-form-actions"><button className="button button-outline" type="button" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button><button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save task"}</button></div>
    </form>}
    {!formOpen && error && <p className="task-error" role="alert">{error}</p>}
    <div className="task-view-tabs" role="group" aria-label="Task views">
      <button type="button" aria-pressed={view === "all"} onClick={() => { setView("all"); setError(""); void refresh("all", 1).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load tasks.")); }}>All tasks</button>
      <button type="button" aria-pressed={view === "mine"} onClick={() => { setView("mine"); setError(""); void refresh("mine", 1).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load tasks.")); }}>My tasks</button>
      <button type="button" aria-pressed={view === "completed"} onClick={() => { setView("completed"); setStatusFilter(""); setError(""); void refresh("completed", 1).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load tasks.")); }}>Completed</button>
    </div>
    <div className="task-filters">
      <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Any status</option><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></label>
      <label>Priority<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="">Any priority</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
      <label>Event<select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="">Any event</option><option value="none">General tasks</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Assigned<select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}><option value="">Anyone</option><option value="none">Unassigned</option>{members.map((member) => <option key={member.membershipId} value={member.membershipId}>{member.user.name}</option>)}</select></label>
      <button className="text-button" type="button" onClick={() => void clearFilters()}>Clear filters</button>
      <button className="button button-outline task-apply-filters" type="button" onClick={() => { setError(""); void refresh(view, 1).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load tasks.")); }}>Apply filters</button>
    </div>
    {tasks.length ? <ul className="task-list">{tasks.map((task) => <li className={`task-card task-${task.status.toLowerCase().replace("_", "-")}`} key={task.id}>
      <div className="task-card-main"><div className="task-card-top"><span className={`task-priority task-priority-${task.priority.toLowerCase()}`}>{task.priority.toLowerCase()} priority</span><span className={`task-status task-status-${task.status.toLowerCase().replace("_", "-")}`}>{task.status === "TODO" ? "To do" : task.status === "IN_PROGRESS" ? "In progress" : "Completed"}</span></div><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span>{task.assignee?.name ?? "Unassigned"}</span><span>{task.event?.name ?? "General wedding task"}</span><time dateTime={task.dueDate ?? undefined}>{dueDateLabel(task.dueDate, timeZone)}</time></div></div>
      {canEdit && <div className="task-card-actions"><label className="task-status-control">Status<select value={task.status} onChange={(event) => void changeStatus(task, event.target.value)}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></label><button className="text-button" type="button" onClick={() => beginEdit(task)}>Edit</button><button className="text-button task-delete" type="button" onClick={() => void removeTask(task)}>Delete</button></div>}
    </li>)}</ul> : <div className="task-empty"><span aria-hidden="true">✦</span><h3>No tasks match this view yet</h3><p>{canEdit ? "Add a task to keep your wedding plans moving." : "Tasks added by your wedding team will appear here."}</p>{canEdit && !formOpen && <button className="text-button" type="button" onClick={beginCreate}>Create your first task</button>}</div>}
    {totalPages > 1 && <div className="task-pagination"><button className="button button-outline" type="button" disabled={page <= 1} onClick={() => void refresh(view, page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-outline" type="button" disabled={page >= totalPages} onClick={() => void refresh(view, page + 1)}>Next</button></div>}
  </div>;
}
