"use client";

import { useState, type FormEvent } from "react";

import styles from "@/components/guests/guest-manager.module.css";

type Guest = {
  id: string; name: string; email: string; phone: string; maxGuests: number;
  invitedEventIds: string[]; invitedEvents: { id: string; name: string; startsAt: string; archivedAt: string | null }[];
  notes: string; rsvpStatus: "PENDING" | "ATTENDING" | "NOT_ATTENDING"; attendingCount: number | null;
  invitationSentAt: string | null;
};
type EventOption = { id: string; name: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };

async function apiJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Unable to save guest details.");
  return body;
}

export function GuestManager({ initialGuests, pagination: initialPagination, events, canEdit }: { initialGuests: Guest[]; pagination: Pagination; events: EventOption[]; canEdit: boolean }) {
  const [guests, setGuests] = useState(initialGuests);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState("");
  const [eventId, setEventId] = useState("");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh(page = 1, filters = { search, rsvpStatus, eventId }) {
    const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
    if (filters.search) params.set("search", filters.search);
    if (filters.rsvpStatus) params.set("rsvpStatus", filters.rsvpStatus);
    if (filters.eventId) params.set("eventId", filters.eventId);
    const result = await apiJson(`/api/guests?${params.toString()}`);
    setGuests(result.data);
    setPagination(result.pagination);
  }

  async function applyFilters(page = 1) {
    setError("");
    const next = { search: searchInput.trim(), rsvpStatus, eventId };
    setSearch(next.search);
    try { await refresh(page, next); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load guests."); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const payload = {
      name: String(form.get("name") ?? "").trim(), email, phone,
      maxGuests: Number(form.get("maxGuests") ?? 1),
      invitedEventIds: form.getAll("invitedEventIds").map(String), notes,
    };
    setBusy(true); setError("");
    try {
      const result = await apiJson(editing ? `/api/guests/${editing.id}` : "/api/guests", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (editing) setGuests((current) => current.map((guest) => guest.id === editing.id ? result.data : guest));
      else setGuests((current) => [result.data, ...current].sort((a, b) => a.name.localeCompare(b.name)));
      setPagination((current) => ({ ...current, total: current.total + (editing ? 0 : 1) }));
      setEditing(null); setFormOpen(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save guest details."); }
    finally { setBusy(false); }
  }

  async function remove(guest: Guest) {
    if (busy || !window.confirm(`Permanently remove ${guest.name} from this wedding's guest list?`)) return;
    setBusy(true); setError("");
    try {
      await apiJson(`/api/guests/${guest.id}`, { method: "DELETE" });
      setGuests((current) => current.filter((item) => item.id !== guest.id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to remove guest."); }
    finally { setBusy(false); }
  }

  function startEdit(guest: Guest) { setError(""); setEditing(guest); setFormOpen(true); }
  function startCreate() { setError(""); setEditing(null); setFormOpen(true); }

  return <div className={styles.manager}>
    <div className={styles.heading}><div><h2>Guest list</h2><p>Keep contact details, party size, and event access together. Invitations and RSVP collection will follow in a later increment.</p></div>{canEdit && <button className="button button-primary" type="button" onClick={formOpen ? () => { setFormOpen(false); setEditing(null); } : startCreate}>{formOpen ? "Close form" : "Add guest"}</button>}</div>
    {formOpen && canEdit && <form className={styles.form} onSubmit={(event) => void save(event)} key={editing?.id ?? "new-guest"}>
      <h3 className={styles.formTitle}>{editing ? "Edit guest details" : "Add a guest"}</h3>
      <div className={styles.fields}>
        <label>Guest or household name<input name="name" required maxLength={120} defaultValue={editing?.name ?? ""} placeholder="Guest name" /></label>
        <label>Email <span>Optional</span><input name="email" type="email" maxLength={254} defaultValue={editing?.email ?? ""} placeholder="name@example.com" /></label>
        <label>Phone <span>Optional</span><input name="phone" type="tel" maxLength={40} defaultValue={editing?.phone ?? ""} placeholder="+91 98765 43210" /></label>
        <label>Maximum guests, including named guest<input name="maxGuests" type="number" min={1} max={10000} step={1} required defaultValue={editing?.maxGuests ?? 1} /></label>
      </div>
      <fieldset className={styles.events}><legend className={styles.eventsLegend}>Events this guest is invited to</legend>{events.length ? events.map((item) => <label className={styles.eventChoice} key={item.id}><input type="checkbox" name="invitedEventIds" value={item.id} defaultChecked={editing?.invitedEventIds.includes(item.id) ?? false} />{item.name}</label>) : <span>No active events yet. You can add events first or leave this guest unassigned.</span>}</fieldset>
      <label>Notes <span>Optional</span><textarea name="notes" maxLength={2000} rows={3} defaultValue={editing?.notes ?? ""} placeholder="Household details or planning notes" /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}><button className="button button-outline" type="button" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save guest"}</button></div>
    </form>}
    {!formOpen && error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.filters}>
      <label>Search name or contact<input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyFilters(); } }} placeholder="Search guest list" /></label>
      <label>RSVP status<select value={rsvpStatus} onChange={(event) => setRsvpStatus(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="ATTENDING">Attending</option><option value="NOT_ATTENDING">Not attending</option></select></label>
      <label>Event<select value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="">All events</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="button button-outline" type="button" onClick={() => void applyFilters()} disabled={busy}>Apply filters</button>
    </div>
    <p className="event-count">{pagination.total} guest {pagination.total === 1 ? "record" : "records"}</p>
    {guests.length ? <ul className={styles.list}>{guests.map((guest) => <li className={styles.card} key={guest.id}>
      <div className={styles.main}><div className={styles.cardHead}><strong className={styles.name}>{guest.name}</strong><span className={`${styles.rsvp} ${guest.rsvpStatus === "ATTENDING" ? styles.rsvpAttending : guest.rsvpStatus === "NOT_ATTENDING" ? styles.rsvpDeclined : ""}`}>{guest.rsvpStatus === "NOT_ATTENDING" ? "Not attending" : guest.rsvpStatus.toLowerCase()}</span></div>
        <div className={styles.details}>{guest.email && <span>{guest.email}</span>}{guest.phone && <span>{guest.phone}</span>}<span>Party limit: {guest.maxGuests}</span><span>{guest.attendingCount === null ? "RSVP not received" : `${guest.attendingCount} attending`}</span></div>
        <p className={styles.eventsList}>{guest.invitedEvents.length ? `Invited to: ${guest.invitedEvents.map((item) => `${item.name}${item.archivedAt ? " (archived)" : ""}`).join(", ")}` : "No event selected"}</p>{guest.notes && <p className={styles.notes}>{guest.notes}</p>}
      </div>
      {canEdit && <div className={styles.actions}><button className="text-button" type="button" onClick={() => startEdit(guest)}>Edit</button><button className={`text-button ${styles.delete}`} type="button" disabled={busy} onClick={() => void remove(guest)}>Remove</button></div>}
    </li>)}</ul> : <div className={styles.empty}><h3>{pagination.total ? "No guests match these filters" : "Your guest list is ready to start"}</h3><p>{canEdit ? "Add a person or household, set the party limit, and choose the celebrations they should see." : "Guests added by your wedding team will appear here."}</p>{canEdit && !formOpen && pagination.total === 0 && <button className="text-button" type="button" onClick={startCreate}>Add the first guest</button>}</div>}
    {pagination.totalPages > 1 && <div className={styles.pagination}><button className="button button-outline" type="button" disabled={busy || pagination.page <= 1} onClick={() => void refresh(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="button button-outline" type="button" disabled={busy || pagination.page >= pagination.totalPages} onClick={() => void refresh(pagination.page + 1)}>Next</button></div>}
  </div>;
}
