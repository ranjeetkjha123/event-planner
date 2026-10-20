import { cookies } from "next/headers";

import { EmailAlreadyExistsError, signup } from "@/modules/auth/signup-service";
import { signupSchema } from "@/modules/auth/signup-schema";
import { checkAuthRateLimit } from "@/modules/auth/rate-limit-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/server/auth/session-token";

function errorResponse(status: number, code: string, message: string, details?: Record<string, string>) {
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !details[field]) details[field] = issue.message;
    }
    return errorResponse(400, "VALIDATION_ERROR", "Please check your account details.", details);
  }

  try {
    const rateLimit = await checkAuthRateLimit("signup", parsed.data.email.toLowerCase());
    if (!rateLimit.allowed) {
      return Response.json(
        { error: { code: "RATE_LIMITED", message: "Too many account attempts. Please try again shortly." } },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const result = await signup(parsed.data);
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
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
      return errorResponse(409, "EMAIL_ALREADY_EXISTS", error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Unable to create your account right now.");
  }
}
