import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { listWeddingEvents } from "@/modules/events/event-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { getWeddingTaskSummary } from "@/modules/tasks/task-service";
import { WeddingDashboard } from "@/components/foundation/wedding-dashboard";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  let current;
  try {
    const cookieStore = await cookies();
    current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  const wedding = await getWeddingForUser(current.user.id);
  if (!wedding) redirect("/onboarding");
  const [events, taskSummary] = await Promise.all([listWeddingEvents(current.user.id), getWeddingTaskSummary(current.user.id, wedding.timeZone)]);
  const params = await searchParams;

  return <main className="foundation-page wedding-dashboard-page">
    <WeddingDashboard wedding={wedding} userName={current.user.name} events={events} taskSummary={taskSummary} savedMessage={params.updated === "1"} />
  </main>;
}
