import "server-only";

import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().url(),
  MONGODB_DATABASE: z.string().min(1).default("make_my_marriage"),
  AUTH_TOKEN_PEPPER: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().trim().max(320).refine((value) => {
    const namedAddress = /^(.*?)\s*<([^<>\r\n]+)>$/.exec(value);
    const email = namedAddress?.[2]?.trim() ?? value;
    return (!namedAddress || namedAddress[1]!.trim().length > 0) && z.string().email().safeParse(email).success;
  }).optional(),
}).refine((env) => Boolean(env.RESEND_API_KEY) === Boolean(env.RESEND_FROM_EMAIL), "RESEND_API_KEY and RESEND_FROM_EMAIL must be configured together.");

export function getServerEnv() {
  if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
    loadEnvConfig(resolve(process.cwd(), ".."), true, console, true);
  }

  const env = serverEnvSchema.parse(process.env);
  if (process.env.NODE_ENV === "production" && !env.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured in production.");
  }
  return env;
}
