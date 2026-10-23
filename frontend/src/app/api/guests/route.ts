import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { createGuestSchema, listGuestsQuerySchema } from "@/modules/guests/guest-schema";
import { createWeddingGuest, GuestServiceError, listWeddingGuests } from "@/modules/guests/guest-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { readJsonBody } from "@/server/http/request-body";

const privateHeaders = { "Cache-Control": "private, no-store" };

function serviceError(error: unknown, action: "load" | "create") {
  if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401, headers: privateHeaders });
  if (error instanceof GuestServiceError) {
    const status = error.code === "READ_ONLY" ? 403 : error.code === "WORKSPACE_REQUIRED" || error.code === "NOT_FOUND" ? 404 : error.code === "EVENT_INVALID" ? 400 : 500;
    if (status !== 500) return Response.json({ error: { code: error.code, message: error.message } }, { status, headers: privateHeaders });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR", message: action === "load" ? "Unable to load wedding guests." : "Unable to create guest." } }, { status: 500, headers: privateHeaders });
}

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
    const query = listGuestsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest filters are invalid.", details: query.error.flatten() } }, { status: 400, headers: privateHeaders });
    return Response.json(await listWeddingGuests(current.user.id, query.data), { headers: privateHeaders });
  } catch (error) { return serviceError(error, "load"); }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value); }
  catch (error) { return serviceError(error, "create"); }
  let body: unknown;
  try { body = await readJsonBody(request, 8_192); }
  catch (error) { return Response.json({ error: { code: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message: "Guest details must be valid JSON within the request size limit." } }, { status: error instanceof RangeError ? 413 : 400, headers: privateHeaders }); }
  const parsed = createGuestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Guest details are invalid.", details: parsed.error.flatten() } }, { status: 400, headers: privateHeaders });
  try { return Response.json({ data: await createWeddingGuest(current.user.id, parsed.data) }, { status: 201, headers: privateHeaders }); }
  catch (error) { return serviceError(error, "create"); }
}
