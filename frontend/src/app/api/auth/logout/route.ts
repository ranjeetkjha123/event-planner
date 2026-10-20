import { cookies } from "next/headers";

import { Session } from "@/modules/auth/models/session";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { connectToDatabase } from "@/server/database/connection";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "This request could not be verified." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      await connectToDatabase();
      await Session.deleteOne({ tokenHash: hashSessionToken(token) });
    } catch {
      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Unable to sign out right now." } },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
