import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { listWeddingMembers } from "@/modules/memberships/invitation-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export async function GET() {
  try {
    const store = await cookies();
    const current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
    if (!current.membership || current.membership.role !== "ADMIN" || !current.wedding) return Response.json({ error: { code: "FORBIDDEN", message: "Only wedding Admins can view members." } }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
    return Response.json({ data: await listWeddingMembers(current.wedding!.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load wedding members." } }, { status: 500 });
  }
}
