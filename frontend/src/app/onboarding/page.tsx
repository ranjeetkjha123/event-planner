import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/foundation/onboarding-wizard";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function OnboardingPage() {
  try {
    const cookieStore = await cookies();
    const current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (current.wedding) redirect("/dashboard");
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) throw error;
    redirect("/login");
  }
  return <OnboardingWizard />;
}
