import "server-only";

import { createHmac } from "node:crypto";

import { getServerEnv } from "@/config/env";
import { AuthRateLimit } from "@/modules/auth/models/rate-limit";
import { connectToDatabase } from "@/server/database/connection";

const EMAIL_WINDOW_SECONDS = 15 * 60;
const SHARED_WINDOW_SECONDS = 60;

type AuthAction = "login" | "signup";

async function incrementCounter(
  action: AuthAction,
  subject: string,
  windowSeconds: number,
  limit: number,
) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const subjectHash = createHmac("sha256", getServerEnv().AUTH_TOKEN_PEPPER)
    .update(`${action}:${subject}`)
    .digest("hex");
  const id = `${action}:${windowStart}:${subjectHash}`;
  const expiresAt = new Date((windowStart + windowSeconds * 2) * 1000);
  const record = await AuthRateLimit.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    allowed: (record?.count ?? 0) <= limit,
    retryAfterSeconds: Math.max(1, windowStart + windowSeconds - nowSeconds),
  };
}

export async function checkAuthRateLimit(action: AuthAction, normalizedEmail: string) {
  await connectToDatabase();

  const sharedLimit = await incrementCounter(
    action,
    "shared",
    SHARED_WINDOW_SECONDS,
    action === "signup" ? 30 : 60,
  );
  if (!sharedLimit.allowed) return sharedLimit;

  return incrementCounter(action, normalizedEmail, EMAIL_WINDOW_SECONDS, 10);
}
