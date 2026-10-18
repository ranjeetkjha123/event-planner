import "server-only";

import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().url(),
  MONGODB_DATABASE: z.string().min(1).default("make_my_marriage"),
  AUTH_TOKEN_PEPPER: z.string().min(32),
});

export function getServerEnv() {
  if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
    loadEnvConfig(resolve(process.cwd(), ".."), true, console, true);
  }

  return serverEnvSchema.parse(process.env);
}
