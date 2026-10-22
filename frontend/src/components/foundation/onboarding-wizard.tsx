"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localDateTimeToIso } from "@/modules/events/event-time";

const eventOptions = ["Engagement", "Mehendi", "Haldi", "Sangeet", "Cocktail", "Wedding", "Reception"];
const eventTypes: Record<string, string> = { Engagement: "ENGAGEMENT", Mehendi: "MEHENDI", Haldi: "HALDI", Sangeet: "SANGEET", Cocktail: "COCKTAIL", Wedding: "WEDDING", Reception: "RECEPTION" };
type Member = { email: string; role: "ADMIN" | "MANAGER" | "VIEWER" };
type SetupEvent = { name: string; type: string; date: string; time: string };

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [couple, setCouple] = useState({ bride: "", groom: "", title: "", description: "", date: "", city: "", timeZone: "Asia/Kolkata" });
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("VIEWER");
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<SetupEvent[]>([{ name: "Wedding", type: "WEDDING", date: "", time: "10:00" }]);
  const [customEvent, setCustomEvent] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceCreated, setWorkspaceCreated] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign-out failed");
      window.location.assign("/login");
    } catch {
      setMessage("Unable to sign out right now. Please try again.");
      setIsSigningOut(false);
    }
  }

  function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setMembers((current) => current.some((member) => member.email.toLowerCase() === email.trim().toLowerCase()) ? current : [...current, { email: email.trim(), role: inviteRole }]);
    setEmail("");
    setInviteRole("VIEWER");
  }

  function toggleEvent(value: string) {
    setEvents((current) => current.some((event) => event.name === value) ? current.filter((event) => event.name !== value) : [...current, { name: value, type: eventTypes[value] ?? "CUSTOM", date: couple.date, time: "10:00" }]);
  }

  function updateEvent(name: string, key: "date" | "time", value: string) {
    setEvents((current) => current.map((event) => event.name === name ? { ...event, [key]: value } : event));
  }

  function addCustomEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = customEvent.trim();
    if (!value) return;
    if (!events.some((event) => event.name.toLowerCase() === value.toLowerCase())) setEvents((current) => [...current, { name: value, type: "CUSTOM", date: couple.date, time: "10:00" }]);
    setCustomEvent("");
  }

  async function createWorkspace() {
    setIsCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/wedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName: couple.bride,
          groomName: couple.groom,
          title: couple.title || undefined,
          description: couple.description || undefined,
          weddingDate: couple.date,
          timeZone: couple.timeZone,
          location: { city: couple.city, formattedAddress: couple.city },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error?.message ?? "Unable to create your wedding workspace. Please try again.");
        return;
      }
      setWorkspaceCreated(true);
      const eventResults = await Promise.all(events.map(async (event) => {
        const eventResponse = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: event.name, type: event.type, startsAt: localDateTimeToIso(event.date, event.time, couple.timeZone) }) });
        return eventResponse.ok;
      }));
      const invitationResults = await Promise.all(members.map(async (member) => {
        const inviteResponse = await fetch("/api/members/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: member.email, role: member.role }) });
        return inviteResponse.ok;
      }));
      const failedEvents = eventResults.filter((ok) => !ok).length;
      const failedInvitations = invitationResults.filter((ok) => !ok).length;
      if (failedEvents || failedInvitations) {
        setMessage(`Your wedding workspace was created. ${failedEvents ? `${failedEvents} event${failedEvents === 1 ? "" : "s"} could not be saved. ` : ""}${failedInvitations ? `${failedInvitations} invitation${failedInvitations === 1 ? "" : "s"} could not be emailed. ` : ""}Continue to your dashboard to review the saved items and try again.`);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to reach the server. Your details are still here; please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="foundation-page onboarding-page">
      <header className="foundation-header"><a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a><div className="onboarding-help">A few thoughtful steps to get started <button className="text-button" type="button" onClick={() => void signOut()} disabled={isSigningOut}>{isSigningOut ? "Signing out…" : "Sign out"}</button></div></header>
      <div className="onboarding-wrap">
        <div className="onboarding-heading"><p className="foundation-eyebrow">YOUR WEDDING, YOUR WAY</p><h1>Let’s make a plan together</h1><p>Start with the couple, invite your co-planners, then shape the celebrations.</p></div>
        <ol className="onboarding-progress" aria-label="Wedding setup steps">
          {["Couple & date", "Family & planners", "Events & traditions"].map((label, index) => {
            const number = index + 1;
            return <li className={step === number ? "is-current" : step > number ? "is-complete" : ""} key={label}><span>{step > number ? "✓" : `0${number}`}</span><div><small>STEP 0{number}</small><strong>{label}</strong></div></li>;
          })}
        </ol>
        <section className="onboarding-card">
          {step === 1 && <div>
            <p className="foundation-eyebrow">STEP 1 · COUPLE &amp; DATE</p><h2>Let’s begin your wedding story</h2><p className="onboarding-description">Add the key details. You can fill in the rest of your wedding profile later.</p>
            <div className="couple-fields">
              <label>Bride’s name<input autoComplete="given-name" value={couple.bride} onChange={(event) => setCouple({ ...couple, bride: event.target.value })} placeholder="Bride’s full name" required /></label>
              <label>Groom’s name<input autoComplete="family-name" value={couple.groom} onChange={(event) => setCouple({ ...couple, groom: event.target.value })} placeholder="Groom’s full name" required /></label>
              <label>Wedding date<input type="date" value={couple.date} onChange={(event) => setCouple({ ...couple, date: event.target.value })} required /></label>
              <label>Wedding city or location<input value={couple.city} onChange={(event) => setCouple({ ...couple, city: event.target.value })} placeholder="e.g. Jaipur, Rajasthan" required /></label>
              <label>Wedding title (optional)<input value={couple.title} onChange={(event) => setCouple({ ...couple, title: event.target.value })} placeholder="e.g. Aanya & Rohan" /></label>
              <label>Time zone<input list="wedding-time-zones" value={couple.timeZone} onChange={(event) => setCouple({ ...couple, timeZone: event.target.value })} placeholder="Asia/Kolkata" required /><datalist id="wedding-time-zones"><option value="Asia/Kolkata" /><option value="Asia/Dubai" /><option value="Asia/Singapore" /><option value="Europe/London" /><option value="Europe/Paris" /><option value="America/New_York" /><option value="America/Los_Angeles" /><option value="Australia/Sydney" /></datalist></label>
            </div>
            <label className="wedding-description-field">Welcome message (optional)<textarea value={couple.description} onChange={(event) => setCouple({ ...couple, description: event.target.value })} maxLength={1000} rows={3} placeholder="A little about your celebration" /></label>
            <div className="onboarding-actions"><span>Next, invite the people planning alongside you.</span><button className="button button-primary" type="button" disabled={!couple.bride.trim() || !couple.groom.trim() || !couple.date || !couple.city.trim()} onClick={() => { setStep(2); setMessage(""); }}>Invite family <span aria-hidden="true">→</span></button></div>
          </div>}
          {step === 2 && <div>
            <p className="foundation-eyebrow">STEP 2 · FAMILY &amp; PLANNERS</p><h2>Plan better, together</h2><p className="onboarding-description">Invite family and friends who will help organize your wedding. You can also do this later.</p>
            <form className="invite-form" onSubmit={addMember}><label htmlFor="planner-email">Their email address</label><div><input id="planner-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="family@example.com" /><select aria-label="Invitation role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Member["role"])}><option value="VIEWER">Viewer · read only</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select><button className="button button-outline" type="submit">Add planner <span aria-hidden="true">＋</span></button></div></form>
            <div className="member-preview"><div className="member-row"><span className="member-avatar">✿</span><div><strong>Workspace creator</strong><small>Becomes the first Wedding Admin</small></div><span className="role-pill role-admin">ADMIN</span></div>
              {members.map((member, index) => <div className="member-row" key={`${member.email}-${index}`}><span className="member-avatar member-avatar-gold">{member.email.slice(0, 1).toUpperCase()}</span><div><strong>{member.email}</strong><small>{member.role === "VIEWER" ? "Can view wedding plans and events" : "Can help plan and manage the wedding"}</small></div><span className="role-pill">{member.role}</span><button className="remove-member" type="button" aria-label={`Remove ${member.email}`} onClick={() => setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}
              {members.length === 0 && <p className="empty-invites">Add a co-planner above, or continue and invite them later.</p>}
            </div>
            <p className="permission-note"><span aria-hidden="true">ⓘ</span> Your account becomes the first Admin. Invitations are emailed after the wedding workspace is created; each invitee accepts with the matching account email.</p>
            <div className="onboarding-actions"><button className="text-button" type="button" onClick={() => { setStep(1); setMessage(""); }}>← Back to couple details</button><button className="button button-primary" type="button" onClick={() => { setStep(3); setMessage(""); }}>Continue to events <span aria-hidden="true">→</span></button></div>
          </div>}
          {step === 3 && <div>
            <p className="foundation-eyebrow">STEP 3 · EVENTS &amp; TRADITIONS</p><h2>Choose your wedding celebrations</h2><p className="onboarding-description">Pick the events you’re planning. You can add, remove, or edit them later.</p>
            <div className="event-options">{eventOptions.map((eventName) => <label className={events.some((event) => event.name === eventName) ? "event-option is-selected" : "event-option"} key={eventName}><input type="checkbox" checked={events.some((event) => event.name === eventName)} onChange={() => toggleEvent(eventName)} /><span className="event-check" aria-hidden="true">{events.some((event) => event.name === eventName) ? "✓" : "+"}</span><span><strong>{eventName}</strong><small>{eventName === "Wedding" ? "The main ceremony" : `Add ${eventName.toLowerCase()} to your celebrations`}</small></span></label>)}</div>
            <form className="custom-event-form" onSubmit={addCustomEvent}><label htmlFor="custom-event">Have another tradition?</label><div><input id="custom-event" value={customEvent} onChange={(event) => setCustomEvent(event.target.value)} placeholder="Add a custom event" /><button className="button button-outline" type="submit">Add event</button></div></form>
            {events.some((event) => !eventOptions.includes(event.name)) && <p className="custom-event-list">Custom events: {events.filter((event) => !eventOptions.includes(event.name)).map((event) => event.name).join(", ")}</p>}
            <div className="setup-event-dates">{events.map((event) => <div className="setup-event-date" key={event.name}><strong>{event.name}</strong><label>Date<input type="date" value={event.date} required onChange={(change) => updateEvent(event.name, "date", change.target.value)} /></label><label>Start time<input type="time" value={event.time} required onChange={(change) => updateEvent(event.name, "time", change.target.value)} /></label></div>)}</div>
            <div className="onboarding-actions"><button className="text-button" type="button" disabled={workspaceCreated} onClick={() => { setStep(2); setMessage(""); }}>← Back to family &amp; planners</button>{workspaceCreated ? <button className="button button-primary" type="button" onClick={() => router.replace("/dashboard")}>Go to dashboard <span aria-hidden="true">→</span></button> : <button className="button button-primary" type="button" disabled={isCreating || events.some((event) => !event.date || !event.time)} onClick={() => void createWorkspace()}>{isCreating ? "Creating workspace…" : "Create wedding workspace"} <span aria-hidden="true">→</span></button>}</div>
            {message && <p className="prototype-message" role="status">{message}</p>}
          </div>}
        </section>
        <p className="prototype-banner"><span aria-hidden="true">✿</span> Wedding details, selected event dates, and co-planner invitations are saved when you create the workspace.</p>
      </div>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
