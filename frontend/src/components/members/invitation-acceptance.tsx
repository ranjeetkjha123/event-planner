"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationAcceptance({ token, email, role, signedIn }: { token: string; email: string; role: string; signedIn: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function accept() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/member-invitations/${token}/accept`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error?.message ?? "Unable to accept this invitation."); return; }
      router.replace("/dashboard");
      router.refresh();
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setPending(false); }
  }
  return <div className="invite-acceptance">
    <p>This invitation was sent to <strong>{email}</strong> with the {role.toLowerCase()} role.</p>
    {signedIn ? <button className="button button-primary" type="button" disabled={pending} onClick={() => void accept()}>{pending ? "Joining wedding…" : "Accept invitation"}</button> : <><p>Sign in or create an account with that email address, then reopen this invitation link.</p><div className="onboarding-actions"><a className="button button-primary" href="/signup">Create account</a><a className="button button-outline" href="/login">Sign in</a></div></>}
    {message && <p role="status" className="prototype-message">{message}</p>}
  </div>;
}
