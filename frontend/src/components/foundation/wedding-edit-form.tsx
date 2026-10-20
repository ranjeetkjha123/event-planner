"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type WeddingDetails = {
  brideName: string;
  groomName: string;
  title: string;
  description: string;
  weddingDate: string;
  timeZone: string;
  location: { formattedAddress: string; city: string; state?: string; country?: string };
};

export function WeddingEditForm({ initial }: { initial: WeddingDetails }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  function change(field: keyof WeddingDetails, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/wedding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result?.error?.message ?? "We couldn’t save your wedding details. Please try again.");
        return;
      }
      router.replace("/dashboard?updated=1");
      router.refresh();
    } catch {
      setMessage("We couldn’t reach the server. Your changes are still here; please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="wedding-edit-form" onSubmit={save}>
      <div className="couple-fields">
        <label htmlFor="edit-bride">Bride name<input id="edit-bride" required maxLength={100} value={form.brideName} onChange={(event) => change("brideName", event.target.value)} /></label>
        <label htmlFor="edit-groom">Groom name<input id="edit-groom" required maxLength={100} value={form.groomName} onChange={(event) => change("groomName", event.target.value)} /></label>
      </div>
      <div className="couple-fields wedding-edit-secondary">
        <label htmlFor="edit-title">Workspace title<input id="edit-title" maxLength={120} value={form.title} onChange={(event) => change("title", event.target.value)} /></label>
        <label htmlFor="edit-date">Wedding date<input id="edit-date" required type="date" value={form.weddingDate} onChange={(event) => change("weddingDate", event.target.value)} /></label>
      </div>
      <label className="wedding-edit-field" htmlFor="edit-address">Location<input id="edit-address" required maxLength={200} value={form.location.formattedAddress} onChange={(event) => setForm((current) => ({ ...current, location: { ...current.location, formattedAddress: event.target.value } }))} /></label>
      <div className="couple-fields wedding-edit-secondary">
        <label htmlFor="edit-city">City<input id="edit-city" required maxLength={100} value={form.location.city} onChange={(event) => setForm((current) => ({ ...current, location: { ...current.location, city: event.target.value } }))} /></label>
        <label htmlFor="edit-state">State / region<input id="edit-state" maxLength={100} value={form.location.state ?? ""} onChange={(event) => setForm((current) => ({ ...current, location: { ...current.location, state: event.target.value } }))} /></label>
      </div>
      <label className="wedding-edit-field" htmlFor="edit-country">Country<input id="edit-country" maxLength={100} value={form.location.country ?? ""} onChange={(event) => setForm((current) => ({ ...current, location: { ...current.location, country: event.target.value } }))} /></label>
      <label className="wedding-description-field" htmlFor="edit-description">Description<textarea id="edit-description" rows={4} maxLength={1000} value={form.description} onChange={(event) => change("description", event.target.value)} /></label>
      <label className="wedding-edit-field" htmlFor="edit-timezone">Time zone<input id="edit-timezone" required maxLength={100} value={form.timeZone} onChange={(event) => change("timeZone", event.target.value)} /></label>
      {message && <p className="prototype-message" role="alert">{message}</p>}
      <div className="onboarding-actions wedding-edit-actions"><a className="text-button" href="/dashboard">Cancel</a><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving changes…" : "Save wedding details"}</button></div>
    </form>
  );
}
