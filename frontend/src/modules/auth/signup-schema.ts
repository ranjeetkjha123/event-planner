import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(128)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password is too long.",
    }),
}).strict();

export type SignupInput = z.infer<typeof signupSchema>;
