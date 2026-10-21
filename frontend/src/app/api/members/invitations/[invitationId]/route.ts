import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { MemberInvitationError, revokeInvitation } from "@/modules/memberships/invitation-service";
import { objectIdSchema } from "@/modules/memberships/invitation-schema";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";

export async function DELETE(request: Request, context: { params: Promise<{ invitationId: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403 });
  const { invitationId } = await context.params;
  if (!objectIdSchema.safeParse(invitationId).success) return Response.json({ error: { code: "NOT_FOUND", message: "Invitation not found." } }, { status: 404 });
  try {
    const store = await cookies();
    const current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
    if (current.membership?.role !== "ADMIN" || !current.wedding) return Response.json({ error: { code: "FORBIDDEN", message: "Only wedding Admins can revoke invitations." } }, { status: 403 });
    await revokeInvitation(current.wedding.id, invitationId);
    return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    if (error instanceof MemberInvitationError) return Response.json({ error: { code: error.code, message: error.message } }, { status: 404 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to revoke invitation." } }, { status: 500 });
  }
}
