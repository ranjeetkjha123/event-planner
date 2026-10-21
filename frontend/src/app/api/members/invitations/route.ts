import { cookies } from "next/headers";

import { getServerEnv } from "@/config/env";
import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { createMemberInvitation, listPendingInvitations, MemberInvitationError } from "@/modules/memberships/invitation-service";
import { createMemberInvitationSchema } from "@/modules/memberships/invitation-schema";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { readJsonBody } from "@/server/http/request-body";

const privateHeaders = { "Cache-Control": "private, no-store" };
function auth() { return cookies().then((store) => getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value)); }

export async function GET() {
  try {
    const current = await auth();
    if (current.membership?.role !== "ADMIN" || !current.wedding) return Response.json({ error: { code: "FORBIDDEN", message: "Only wedding Admins can view invitations." } }, { status: 403, headers: privateHeaders });
    return Response.json({ data: await listPendingInvitations(current.wedding.id) }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load invitations." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403 });
  let current;
  try { current = await auth(); }
  catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to send invitation." } }, { status: 500 });
  }
  if (current.membership?.role !== "ADMIN" || !current.wedding) return Response.json({ error: { code: "FORBIDDEN", message: "Only wedding Admins can invite members." } }, { status: 403 });
  let body: unknown;
  try { body = await readJsonBody(request, 8_192); }
  catch (error) { return Response.json({ error: { code: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message: "Invalid invitation data." } }, { status: error instanceof RangeError ? 413 : 400 }); }
  const parsed = createMemberInvitationSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Enter a valid email address." } }, { status: 400 });
  try {
    const configuredOrigin = getServerEnv().NEXT_PUBLIC_APP_URL;
    const origin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : process.env.NODE_ENV !== "production"
        ? new URL(request.url).origin
        : null;
    if (!origin) throw new Error("Invitation app URL is not configured.");
    const data = await createMemberInvitation({ userId: current.user.id, weddingId: current.wedding.id, inviterId: current.user.id, ...parsed.data, origin });
    return Response.json({ data }, { status: 201, headers: privateHeaders });
  } catch (error) {
    if (error instanceof MemberInvitationError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.code === "NOT_FOUND" ? 404 : error.code === "EMAIL_DELIVERY_FAILED" ? 502 : 409 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to send invitation." } }, { status: 500 });
  }
}
