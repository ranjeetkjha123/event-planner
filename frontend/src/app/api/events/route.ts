import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { createEventSchema } from "@/modules/events/event-schema";
import { createWeddingEvent, listWeddingEvents, WeddingMembershipRequiredError } from "@/modules/events/event-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { readJsonBody } from "@/server/http/request-body";

export async function GET() {
  try {
    const store = await cookies();
    const current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value);
    return Response.json({ data: await listWeddingEvents(current.user.id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load events." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403 });
  let current;
  try { const store = await cookies(); current = await getCurrentUser(store.get(SESSION_COOKIE_NAME)?.value); }
  catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create event." } }, { status: 500 });
  }
  let body: unknown;
  try { body = await readJsonBody(request, 8_192); }
  catch (error) { return Response.json({ error: { code: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message: "Invalid event data." } }, { status: error instanceof RangeError ? 413 : 400 }); }
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Check the event details." } }, { status: 400 });
  try { return Response.json({ data: await createWeddingEvent(current.user.id, parsed.data) }, { status: 201, headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) {
    if (error instanceof WeddingMembershipRequiredError) return Response.json({ error: { code: "NOT_FOUND", message: error.message } }, { status: 404 });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create event." } }, { status: 500 });
  }
}
