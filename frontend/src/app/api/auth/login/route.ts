import { cookies } from "next/headers";

import { login, InvalidCredentialsError } from "@/modules/auth/login-service";
import { loginSchema } from "@/modules/auth/login-schema";
import { checkAuthRateLimit } from "@/modules/auth/rate-limit-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/server/auth/session-token";

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse(403, "FORBIDDEN", "This request could not be verified.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !details[field]) details[field] = issue.message;
    }
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request data.", details);
  }

  try {
    const rateLimit = await checkAuthRateLimit("login", parsed.data.email.toLowerCase());
    if (!rateLimit.allowed) {
      return Response.json(
        { error: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Please try again shortly." } },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const result = await login(parsed.data);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
      expires: result.expiresAt,
    });

    return Response.json(
      { data: { user: result.user, hasWedding: result.hasWedding } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return errorResponse(401, "INVALID_CREDENTIALS", error.message);
    }

    return errorResponse(500, "INTERNAL_ERROR", "Unable to sign in right now.");
  }
}
