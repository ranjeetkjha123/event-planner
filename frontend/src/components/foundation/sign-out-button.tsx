"use client";

import { useState } from "react";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign-out failed");
      window.location.assign("/login");
    } catch {
      setPending(false);
    }
  }

  return <button className="text-button" type="button" onClick={() => void signOut()} disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button>;
}
