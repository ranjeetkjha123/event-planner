import { z } from "zod";

export const createMemberInvitationSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]).default("VIEWER"),
}).strict();

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
}).strict();

export const tokenSchema = z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/);
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
