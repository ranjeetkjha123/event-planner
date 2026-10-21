import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { MembershipError, updateWeddingMemberRole } from "@/modules/memberships/membership-service";
import { objectIdSchema, updateMemberRoleSchema } from "@/modules/memberships/invitation-schema";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { readJsonBody } from "@/server/http/request-body";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function PATCH(request: Request, context: { params: Promise<{ membershipId: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403 });
  const { membershipId } = await context.params;
  if (!objectIdSchema.safeParse(membershipId).success) return Response.json({ error: { code: "NOT_FOUND", message: "Wedding member not found." } }, { status: 404 });

  let current;
  try {
    const store = await cookies();
    current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to change member role." } }, { status: 500 });
  }
  if (current.membership?.role !== "ADMIN" || !current.wedding) return Response.json({ error: { code: "FORBIDDEN", message: "Only wedding Admins can change member roles." } }, { status: 403 });

  let body: unknown;
  try { body = await readJsonBody(request, 2_048); }
  catch (error) { return Response.json({ error: { code: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message: "Invalid role selection." } }, { status: error instanceof RangeError ? 413 : 400 }); }
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Choose Admin or Manager." } }, { status: 400 });

  try {
    await updateWeddingMemberRole({ weddingId: current.wedding.id, actorUserId: current.user.id, membershipId, role: parsed.data.role });
    return Response.json({ success: true, data: { membershipId, role: parsed.data.role } }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof MembershipError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "LAST_ADMIN" ? 409 : 500;
      return Response.json({ error: { code: error.code, message: error.message } }, { status, headers: privateHeaders });
    }
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to change member role." } }, { status: 500, headers: privateHeaders });
  }
}
