import { cookies } from "next/headers";
import { z } from "zod";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { updateEventSchema } from "@/modules/events/event-schema";
import { archiveWeddingEvent, EventConflictError, EventNotFoundError, updateWeddingEvent, WeddingMembershipRequiredError, WeddingReadOnlyError } from "@/modules/events/event-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { readJsonBody } from "@/server/http/request-body";

const paramsSchema = z.object({ eventId: z.string().regex(/^[a-f\d]{24}$/i) });
const headers = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers });
}

async function currentUser() {
  const store = await cookies();
  return getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
}

function mapServiceError(error: unknown) {
  if (error instanceof UnauthenticatedError) return errorResponse(401, "UNAUTHENTICATED", error.message);
  if (error instanceof WeddingMembershipRequiredError || error instanceof EventNotFoundError) return errorResponse(404, "NOT_FOUND", error.message);
  if (error instanceof WeddingReadOnlyError) return errorResponse(403, "FORBIDDEN", error.message);
  if (error instanceof EventConflictError) return errorResponse(409, "CONFLICT", error.message);
  return errorResponse(500, "INTERNAL_ERROR", "Unable to update the event.");
}

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  if (!isSameOriginRequest(request)) return errorResponse(403, "FORBIDDEN", "This request could not be verified.");
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) return errorResponse(400, "VALIDATION_ERROR", "Invalid event ID.");
  let current;
  try { current = await currentUser(); }
  catch (error) { return mapServiceError(error); }
  let body: unknown;
  try { body = await readJsonBody(request, 8_192); }
  catch (error) { return errorResponse(error instanceof RangeError ? 413 : 400, error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", "Invalid event data."); }
  const parsedBody = updateEventSchema.safeParse(body);
  if (!parsedBody.success) return errorResponse(400, "VALIDATION_ERROR", parsedBody.error.issues[0]?.message ?? "Check the event details.");
  try {
    const event = await updateWeddingEvent(current.user.id, parsedParams.data.eventId, parsedBody.data);
    return Response.json({ data: event }, { headers });
  } catch (error) {
    if (error instanceof RangeError) return errorResponse(400, "VALIDATION_ERROR", error.message);
    return mapServiceError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ eventId: string }> }) {
  if (!isSameOriginRequest(request)) return errorResponse(403, "FORBIDDEN", "This request could not be verified.");
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) return errorResponse(400, "VALIDATION_ERROR", "Invalid event ID.");
  try {
    const current = await currentUser();
    await archiveWeddingEvent(current.user.id, parsedParams.data.eventId);
    return Response.json({ success: true }, { headers });
  } catch (error) {
    return mapServiceError(error);
  }
}
