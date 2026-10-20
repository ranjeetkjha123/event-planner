"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const eventOptions = ["Engagement", "Mehendi", "Haldi", "Sangeet", "Cocktail", "Wedding", "Reception"];
type Member = { email: string; role: "MANAGER" };

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [couple, setCouple] = useState({ bride: "", groom: "", title: "", description: "", date: "", city: "", timeZone: "Asia/Kolkata" });
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<string[]>(["Wedding"]);
  const [customEvent, setCustomEvent] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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
    setMembers((current) => [...current, { email: email.trim(), role: "MANAGER" }]);
    setEmail("");
  }

  function toggleEvent(value: string) {
    setEvents((current) => current.includes(value) ? current.filter((event) => event !== value) : [...current, value]);
  }

  function addCustomEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = customEvent.trim();
    if (!value) return;
    if (!events.includes(value)) setEvents((current) => [...current, value]);
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
            <form className="invite-form" onSubmit={addMember}><label htmlFor="planner-email">Their email address</label><div><input id="planner-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="family@example.com" /><button className="button button-outline" type="submit">Add planner <span aria-hidden="true">＋</span></button></div></form>
            <div className="member-preview"><div className="member-row"><span className="member-avatar">✿</span><div><strong>Workspace creator</strong><small>Becomes the first Wedding Admin</small></div><span className="role-pill role-admin">ADMIN</span></div>
              {members.map((member, index) => <div className="member-row" key={`${member.email}-${index}`}><span className="member-avatar member-avatar-gold">{member.email.slice(0, 1).toUpperCase()}</span><div><strong>{member.email}</strong><small>Can help plan and manage the wedding</small></div><span className="role-pill">MANAGER</span><button className="remove-member" type="button" aria-label={`Remove ${member.email}`} onClick={() => setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}
              {members.length === 0 && <p className="empty-invites">Add a co-planner above, or continue and invite them later.</p>}
            </div>
            <p className="permission-note"><span aria-hidden="true">ⓘ</span> Your workspace creator account becomes its first Admin. Adding names here is currently a preview; invitations will be built in the next member-management increment.</p>
            <div className="onboarding-actions"><button className="text-button" type="button" onClick={() => { setStep(1); setMessage(""); }}>← Back to couple details</button><button className="button button-primary" type="button" onClick={() => { setStep(3); setMessage(""); }}>Continue to events <span aria-hidden="true">→</span></button></div>
          </div>}
          {step === 3 && <div>
            <p className="foundation-eyebrow">STEP 3 · EVENTS &amp; TRADITIONS</p><h2>Choose your wedding celebrations</h2><p className="onboarding-description">Pick the events you’re planning. You can add, remove, or edit them later.</p>
            <div className="event-options">{eventOptions.map((eventName) => <label className={events.includes(eventName) ? "event-option is-selected" : "event-option"} key={eventName}><input type="checkbox" checked={events.includes(eventName)} onChange={() => toggleEvent(eventName)} /><span className="event-check" aria-hidden="true">{events.includes(eventName) ? "✓" : "+"}</span><span><strong>{eventName}</strong><small>{eventName === "Wedding" ? "The main ceremony" : `Add ${eventName.toLowerCase()} to your celebrations`}</small></span></label>)}</div>
            <form className="custom-event-form" onSubmit={addCustomEvent}><label htmlFor="custom-event">Have another tradition?</label><div><input id="custom-event" value={customEvent} onChange={(event) => setCustomEvent(event.target.value)} placeholder="Add a custom event" /><button className="button button-outline" type="submit">Add event</button></div></form>
            {events.some((eventName) => !eventOptions.includes(eventName)) && <p className="custom-event-list">Custom events: {events.filter((eventName) => !eventOptions.includes(eventName)).join(", ")}</p>}
            <div className="onboarding-actions"><button className="text-button" type="button" onClick={() => { setStep(2); setMessage(""); }}>← Back to family &amp; planners</button><button className="button button-primary" type="button" disabled={isCreating} onClick={() => void createWorkspace()}>{isCreating ? "Creating workspace…" : "Create wedding workspace"} <span aria-hidden="true">→</span></button></div>
            {message && <p className="prototype-message" role="status">{message}</p>}
          </div>}
        </section>
        <p className="prototype-banner"><span aria-hidden="true">✿</span> Wedding details are saved when you create the workspace. Planner invitations and event selections are currently previews and are not saved yet.</p>
      </div>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
