import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { getServerEnv } from "@/config/env";

export const SESSION_COOKIE_NAME = "mmm_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHmac("sha256", getServerEnv().AUTH_TOKEN_PEPPER)
    .update(token)
    .digest("hex");

  return { token, tokenHash };
}

export function hashSessionToken(token: string) {
  return createHmac("sha256", getServerEnv().AUTH_TOKEN_PEPPER)
    .update(token)
    .digest("hex");
}
