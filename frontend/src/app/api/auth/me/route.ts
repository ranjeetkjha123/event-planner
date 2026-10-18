import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUser = await getCurrentUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    return Response.json({ data: currentUser }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHENTICATED", message: error.message } },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to load the signed-in account." } },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
