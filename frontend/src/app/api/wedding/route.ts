import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { createWedding, getWeddingForUser, WeddingAlreadyExistsError } from "@/modules/weddings/create-wedding-service";
import { createWeddingSchema } from "@/modules/weddings/create-wedding-schema";
import { updateWeddingSchema } from "@/modules/weddings/update-wedding-schema";
import { updateWeddingForUser, WeddingNotFoundError } from "@/modules/weddings/update-wedding-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";

const headers = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string, details?: Record<string, string>) {
  return Response.json({ error: { code, message, ...(details ? { details } : {}) } }, { status, headers });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    const wedding = await getWeddingForUser(current.user.id);
    if (!wedding) return errorResponse(404, "NOT_FOUND", "Wedding workspace not found.");
    return Response.json({ data: wedding }, { headers });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return errorResponse(401, "UNAUTHENTICATED", error.message);
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load the wedding workspace.");
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(403, "FORBIDDEN", "This request could not be verified.");

  let body: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) return errorResponse(413, "PAYLOAD_TOO_LARGE", "Wedding details are too large.");
    const reader = request.body?.getReader();
    if (!reader) return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.");
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > 16_384) {
        await reader.cancel();
        return errorResponse(413, "PAYLOAD_TOO_LARGE", "Wedding details are too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.");
  }

  const parsed = createWeddingSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !details[field]) details[field] = issue.message;
    }
    return errorResponse(400, "VALIDATION_ERROR", "Please check the wedding details.", details);
  }

  try {
    const cookieStore = await cookies();
    const current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    const wedding = await createWedding(current.user.id, parsed.data);
    return Response.json({ data: wedding }, { status: 201, headers });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return errorResponse(401, "UNAUTHENTICATED", error.message);
    if (error instanceof WeddingAlreadyExistsError) return errorResponse(409, "ALREADY_HAS_WEDDING", error.message);
    return errorResponse(500, "INTERNAL_ERROR", "Unable to create the wedding workspace.");
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(403, "FORBIDDEN", "This request could not be verified.");

  let current;
  try {
    const cookieStore = await cookies();
    current = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    if (error instanceof UnauthenticatedError) return errorResponse(401, "UNAUTHENTICATED", error.message);
    return errorResponse(500, "INTERNAL_ERROR", "Unable to update the wedding workspace.");
  }
  if (current.membership?.role !== "ADMIN" && current.membership?.role !== "MANAGER") {
    return errorResponse(403, "FORBIDDEN", "You do not have permission to edit wedding details.");
  }

  let body: unknown;
  try {
    if (Number(request.headers.get("content-length") ?? "0") > 16_384) return errorResponse(413, "PAYLOAD_TOO_LARGE", "Wedding details are too large.");
    const reader = request.body?.getReader();
    if (!reader) return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.");
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > 16_384) {
        await reader.cancel();
        return errorResponse(413, "PAYLOAD_TOO_LARGE", "Wedding details are too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.");
  }

  const parsed = updateWeddingSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !details[field]) details[field] = issue.message;
    }
    return errorResponse(400, "VALIDATION_ERROR", "Please check the wedding details.", details);
  }

  try {
    const wedding = await updateWeddingForUser(current.user.id, parsed.data);
    return Response.json({ data: wedding }, { headers });
  } catch (error) {
    if (error instanceof WeddingNotFoundError) return errorResponse(404, "NOT_FOUND", error.message);
    return errorResponse(500, "INTERNAL_ERROR", "Unable to update the wedding workspace.");
  }
}
