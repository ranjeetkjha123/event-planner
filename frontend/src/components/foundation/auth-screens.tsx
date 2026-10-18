"use client";

import { useState } from "react";

type AuthMode = "login" | "signup" | "forgot";

const copy = {
  login: {
    eyebrow: "WELCOME BACK",
    title: "Your plans are waiting",
    description: "Sign in to return to your shared wedding workspace.",
    button: "Sign in",
    foot: "New to Make My Marriage?",
    footLink: "Create an account",
    footHref: "/signup",
  },
  signup: {
    eyebrow: "A WEDDING PLANNED TOGETHER",
    title: "Create your account",
    description: "Start with one account, then bring your family into the plan.",
    button: "Create account",
    foot: "Already planning with us?",
    footLink: "Sign in",
    footHref: "/login",
  },
  forgot: {
    eyebrow: "ACCOUNT RECOVERY",
    title: "Reset your password",
    description: "Enter the email address you used for your account.",
    button: "Send reset link",
    foot: "Remember your password?",
    footLink: "Sign in",
    footHref: "/login",
  },
} satisfies Record<AuthMode, { eyebrow: string; title: string; description: string; button: string; foot: string; footLink: string; footHref: string }>;

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const text = copy[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (mode !== "login") {
      setMessage("Account creation and password recovery are the next authentication steps.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json() as {
        data?: { user?: { name?: string }; hasWedding?: boolean };
        error?: { message?: string };
      };

      if (!response.ok) {
        setMessage(result.error?.message ?? "Unable to sign in right now.");
        return;
      }

      const currentUserResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (!currentUserResponse.ok) {
        setMessage("Your sign-in could not be confirmed. Please try again.");
        return;
      }

      const currentUserResult = await currentUserResponse.json() as {
        data?: { user?: { name?: string }; membership?: { role?: string } | null };
      };
      setIsSuccess(true);
      setMessage(
        currentUserResult.data?.membership
          ? `Welcome back${currentUserResult.data.user?.name ? `, ${currentUserResult.data.user.name}` : ""}. Your account is signed in.`
          : "You’re signed in. Set up your wedding workspace to continue.",
      );
    } catch {
      setMessage("Unable to reach the sign-in service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="foundation-page">
      <header className="foundation-header"><a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a><a className="foundation-home-link" href="/">Back to homepage</a></header>
      <section className="auth-layout">
        <div className="auth-art" aria-label="Make My Marriage account introduction">
          <span className="auth-art-mark" aria-hidden="true">✿</span>
          <p className="foundation-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
          <div className="auth-art-card"><span aria-hidden="true">♡</span><div><strong>One shared place</strong><small>For every person helping make the day yours.</small></div></div>
        </div>
        <div className="auth-card">
          <p className="foundation-eyebrow">{mode === "forgot" ? "PASSWORD HELP" : "MAKE MY MARRIAGE"}</p>
          <h2>{mode === "login" ? "Sign in with email" : text.title}</h2>
          <p className="auth-card-intro">{mode === "login" ? "Use the email and password on your account." : text.description}</p>
          <form onSubmit={(event) => void handleSubmit(event)}>
            {mode === "signup" && <label>Your name<input autoComplete="name" name="name" placeholder="Full name" required /></label>}
            <label>Email address<input autoComplete="email" name="email" type="email" placeholder="you@example.com" required /></label>
            {mode !== "forgot" && <label>Password<input autoComplete={mode === "login" ? "current-password" : "new-password"} name="password" type="password" minLength={8} placeholder="At least 8 characters" required /></label>}
            {mode === "login" && <a className="auth-inline-link" href="/forgot-password">Forgot password?</a>}
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : text.button}<span aria-hidden="true">→</span></button>
          </form>
          {message && <p className="prototype-message" role={isSuccess ? "status" : "alert"}>{message}</p>}
          <div className="auth-divider"><span>PRIVATE BY DESIGN</span></div>
          <p className="auth-assurance"><span aria-hidden="true">✓</span> Guests can RSVP without creating an account.</p>
          <p className="auth-switch">{text.foot} <a href={text.footHref}>{text.footLink}</a></p>
        </div>
      </section>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
