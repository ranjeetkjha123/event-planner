import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WeddingEditForm } from "@/components/foundation/wedding-edit-form";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { getWeddingForUser } from "@/modules/weddings/create-wedding-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export default async function EditWeddingPage() {
  let current;
  try {
    const cookieStore = await cookies();
    current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }
  if (!current.wedding) redirect("/onboarding");
  if (current.membership?.role !== "ADMIN" && current.membership?.role !== "MANAGER") redirect("/dashboard");

  const wedding = await getWeddingForUser(current.user.id);
  if (!wedding) redirect("/onboarding");

  return (
    <main className="foundation-page">
      <header className="foundation-header">
        <a className="brand" href="/" aria-label="Make My Marriage home"><span className="brand-icon" aria-hidden="true">♡</span><span>Make My <b>Marriage</b></span></a>
        <div className="onboarding-help">Your account · {current.user.name}</div>
      </header>
      <section className="onboarding-wrap">
        <div className="onboarding-heading"><p className="foundation-eyebrow">WEDDING SETTINGS</p><h1>Edit wedding details</h1><p>Update the details shown in your wedding workspace.</p></div>
        <section className="onboarding-card wedding-edit-card"><WeddingEditForm initial={{
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          title: wedding.title,
          description: wedding.description,
          weddingDate: wedding.weddingDate,
          timeZone: wedding.timeZone,
          location: { formattedAddress: wedding.location.formattedAddress, city: wedding.location.city, state: wedding.location.state, country: wedding.location.country },
        }} /></section>
      </section>
      <footer className="foundation-footer"><span>Make My Marriage</span><span>One shared place for your wedding plans.</span></footer>
    </main>
  );
}
