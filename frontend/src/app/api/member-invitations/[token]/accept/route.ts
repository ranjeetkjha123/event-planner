import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { acceptInvitation, MemberInvitationError } from "@/modules/memberships/invitation-service";
import { tokenSchema } from "@/modules/memberships/invitation-schema";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403 });
  const { token } = await context.params;
  if (!tokenSchema.safeParse(token).success) return Response.json({ error: { code: "INVALID_TOKEN", message: "This invitation is invalid, expired, or no longer available." } }, { status: 404 });
  try {
    const store = await cookies();
    const current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
    const data = await acceptInvitation({ token, userId: current.user.id, normalizedEmail: current.user.email.toLowerCase() });
    return Response.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    if (error instanceof MemberInvitationError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.code === "INVALID_TOKEN" ? 404 : 409 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to accept invitation." } }, { status: 500 });
  }
}
