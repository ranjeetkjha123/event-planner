"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { membershipId: string; user: { name: string; email: string }; role: string; joinedAt: string };
type Invitation = { id: string; email: string; role: string; expiresAt: string };
type WeddingRole = "ADMIN" | "MANAGER";

export function MemberManagement({ members, invitations }: { members: Member[]; invitations: Invitation[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, WeddingRole>>({});
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/members/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: "MANAGER" }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error?.message ?? "Unable to send invitation."); return; }
      setEmail(""); setMessage(`Invitation sent to ${result.data.email}.`); router.refresh();
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/members/invitations/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error?.message ?? "Unable to revoke invitation."); return; }
      setMessage("Invitation revoked."); router.refresh();
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setBusy(false); }
  }
  async function updateRole(member: Member) {
    const role = selectedRoles[member.membershipId] ?? member.role as WeddingRole;
    if (role === member.role) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/members/${member.membershipId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error?.message ?? "Unable to change member role."); return; }
      setMessage(`${member.user.name}'s role changed to ${role}.`);
      router.refresh();
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="member-management">
    <form className="invite-form" onSubmit={(event) => void invite(event)}><label htmlFor="member-email">Invite a co-planner</label><div><input id="member-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="family@example.com"/><button className="button button-primary" disabled={busy}>{busy ? "Please wait…" : "Send invitation"}</button></div></form>
    {message && <p className="prototype-message" role="status">{message}</p>}
    <h2>Wedding members</h2><div className="member-preview">{members.map((member) => {
      const selectedRole = selectedRoles[member.membershipId] ?? member.role as WeddingRole;
      return <div className="member-row" key={member.membershipId}><span className="member-avatar">{member.user.name.slice(0,1).toUpperCase()}</span><div><strong>{member.user.name}</strong><small>{member.user.email}</small></div><div className="member-role-editor"><select aria-label={`Role for ${member.user.name}`} value={selectedRole} onChange={(event) => setSelectedRoles((roles) => ({ ...roles, [member.membershipId]: event.target.value as WeddingRole }))}><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option></select><button type="button" className="button button-outline member-role-save" disabled={busy || selectedRole === member.role} onClick={() => void updateRole(member)}>{busy ? "Saving…" : "Save"}</button></div></div>;
    })}</div>
    <h2>Pending invitations</h2>{invitations.length ? <div className="member-preview">{invitations.map((invitation) => <div className="member-row" key={invitation.id}><span className="member-avatar member-avatar-gold">✉</span><div><strong>{invitation.email}</strong><small>{invitation.role} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}</small></div><button type="button" className="text-button" disabled={busy} onClick={() => void revoke(invitation.id)}>Revoke</button></div>)}</div> : <p className="empty-invites">No pending invitations.</p>}
  </div>;
}
