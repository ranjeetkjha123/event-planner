import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { guestIdSchema, updateGuestSchema } from "@/modules/guests/guest-schema";
import { deleteWeddingGuest, getWeddingGuest, GuestServiceError, updateWeddingGuest } from "@/modules/guests/guest-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { readJsonBody } from "@/server/http/request-body";

type RouteContext = { params: Promise<{ guestId: string }> };
const privateHeaders = { "Cache-Control": "private, no-store" };

function serviceError(error: unknown) {
  if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401, headers: privateHeaders });
  if (error instanceof GuestServiceError) {
    const status = error.code === "READ_ONLY" ? 403 : error.code === "WORKSPACE_REQUIRED" || error.code === "NOT_FOUND" ? 404 : error.code === "EVENT_INVALID" ? 400 : error.code === "CAPACITY_CONFLICT" || error.code === "CONFLICT" ? 409 : 500;
    if (status !== 500) return Response.json({ error: { code: error.code, message: error.message } }, { status, headers: privateHeaders });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to complete the guest request." } }, { status: 500, headers: privateHeaders });
}

async function currentUser() {
  return getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}

async function parseGuestId(context: RouteContext) {
  const params = await context.params;
  return guestIdSchema.safeParse(params.guestId);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const current = await currentUser();
    const id = await parseGuestId(context);
    if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest ID is invalid." } }, { status: 400, headers: privateHeaders });
    return Response.json({ data: await getWeddingGuest(current.user.id, id.data) }, { headers: privateHeaders });
  } catch (error) { return serviceError(error); }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await currentUser(); }
  catch (error) { return serviceError(error); }
  const id = await parseGuestId(context);
  if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest ID is invalid." } }, { status: 400, headers: privateHeaders });
  let body: unknown;
  try { body = await readJsonBody(request, 8_192); }
  catch (error) { return Response.json({ error: { code: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message: "Guest details must be valid JSON within the request size limit." } }, { status: error instanceof RangeError ? 413 : 400, headers: privateHeaders }); }
  const parsed = updateGuestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest details are invalid.", details: parsed.error.flatten() } }, { status: 400, headers: privateHeaders });
  try { return Response.json({ data: await updateWeddingGuest(current.user.id, id.data, parsed.data) }, { headers: privateHeaders }); }
  catch (error) { return serviceError(error); }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await currentUser(); }
  catch (error) { return serviceError(error); }
  const id = await parseGuestId(context);
  if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest ID is invalid." } }, { status: 400, headers: privateHeaders });
  try {
    await deleteWeddingGuest(current.user.id, id.data);
    return Response.json({ data: { success: true } }, { headers: privateHeaders });
  } catch (error) { return serviceError(error); }
}
