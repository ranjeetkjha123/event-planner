import { cookies } from "next/headers";

import { LandingPage } from "@/components/home/landing-page";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let account: { name: string; hasWedding: boolean } | null = null;

  if (token) {
    try {
      const current = await getCurrentUser(token);
      account = { name: current.user.name, hasWedding: Boolean(current.wedding) };
    } catch (error) {
      if (!(error instanceof UnauthenticatedError)) throw error;
    }
  }

  return <LandingPage account={account} />;
}
