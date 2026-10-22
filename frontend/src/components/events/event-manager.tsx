"use client";

import { useState } from "react";

import { localDateTimeToIso } from "@/modules/events/event-time";

type WeddingEvent = {
  id: string;
  name: string;
  type: string | null;
  startsAt: string;
  endsAt: string | null;
  venueName: string;
  address: string;
  description: string;
  dressCode: string;
};

const eventTypes = ["ROKA", "ENGAGEMENT", "MEHENDI", "HALDI", "SANGEET", "COCKTAIL", "WEDDING", "RECEPTION", "CUSTOM"];

function localInputValue(value: string | null, timeZone: string) {
  if (!value) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function eventPayload(form: FormData, timeZone: string) {
  const starts = String(form.get("startsAt") ?? "");
  const ends = String(form.get("endsAt") ?? "");
  const [startDate, startTime] = starts.split("T");
  const [endDate, endTime] = ends.split("T");
  return {
    name: String(form.get("name") ?? ""),
    type: String(form.get("type") ?? "CUSTOM"),
    startsAt: localDateTimeToIso(startDate ?? "", startTime ?? "", timeZone),
    endsAt: endDate && endTime ? localDateTimeToIso(endDate, endTime, timeZone) : null,
    venueName: String(form.get("venueName") ?? ""),
    address: String(form.get("address") ?? ""),
    description: String(form.get("description") ?? ""),
    dressCode: String(form.get("dressCode") ?? ""),
  };
}

export function EventManager({ initialEvents, timeZone, canEdit }: { initialEvents: WeddingEvent[]; timeZone: string; canEdit: boolean }) {
  const [events, setEvents] = useState(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventPayload(form, timeZone)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to save event.");
      setEvents((current) => current.map((item) => item.id === id ? result.data : item).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setEditingId(null);
      setMessage("Event changes saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save event.");
    } finally { setBusyId(null); }
  }

  async function archive(item: WeddingEvent) {
    if (busyId || !window.confirm(`Archive ${item.name}? It will leave the active event list. Existing task and guest references are retained.`)) return;
    setBusyId(item.id);
    setMessage("");
    try {
      const response = await fetch(`/api/events/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to archive event.");
      setEvents((current) => current.filter((event) => event.id !== item.id));
      setMessage(`${item.name} was archived.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive event.");
    } finally { setBusyId(null); }
  }

  return <>
    {message && <p className="dashboard-saved-message" role="status">{message}</p>}
    {events.length === 0 ? <p className="empty-invites">No active events. Add events during wedding setup.</p> : <ul className="managed-event-list">{events.map((item) => <li className="managed-event" key={item.id}>
      {editingId === item.id ? <form className="managed-event-form" onSubmit={(event) => void save(event, item.id)}>
        <label>Event name<input name="name" defaultValue={item.name} maxLength={120} required /></label>
        <div className="couple-fields">
          <label>Type<select name="type" defaultValue={item.type ?? "CUSTOM"}>{eventTypes.map((type) => <option key={type} value={type}>{type[0]}{type.slice(1).toLowerCase()}</option>)}</select></label>
          <label>Starts at<input name="startsAt" type="datetime-local" defaultValue={localInputValue(item.startsAt, timeZone)} required /></label>
          <label>Ends at (optional)<input name="endsAt" type="datetime-local" defaultValue={localInputValue(item.endsAt, timeZone)} /></label>
          <label>Venue<input name="venueName" defaultValue={item.venueName} maxLength={200} /></label>
          <label>Address<input name="address" defaultValue={item.address} maxLength={300} /></label>
          <label>Dress code<input name="dressCode" defaultValue={item.dressCode} maxLength={120} /></label>
        </div>
        <label className="wedding-description-field">Description<textarea name="description" defaultValue={item.description} maxLength={2000} rows={3} /></label>
        <div className="wedding-edit-actions"><button className="button button-outline" type="button" onClick={() => setEditingId(null)}>Cancel</button><button className="button button-primary" type="submit" disabled={busyId === item.id}>{busyId === item.id ? "Saving…" : "Save event"}</button></div>
      </form> : <>
        <div className="managed-event-summary"><div><strong>{item.name}</strong><small>{item.type ?? "Custom event"}{item.venueName ? ` · ${item.venueName}` : ""}</small></div><time dateTime={item.startsAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(item.startsAt))}</time></div>
        {canEdit && <div className="managed-event-actions"><button className="button button-outline" type="button" onClick={() => { setEditingId(item.id); setMessage(""); }}>Edit</button><button className="text-button" type="button" disabled={busyId === item.id} onClick={() => void archive(item)}>{busyId === item.id ? "Archiving…" : "Archive"}</button></div>}
      </>}
    </li>)}</ul>}
  </>;
}
