import "server-only";

import { hash } from "bcryptjs";

import { connectToDatabase } from "@/server/database/connection";
import { createSessionToken, SESSION_DURATION_SECONDS } from "@/server/auth/session-token";
import { Session } from "@/modules/auth/models/session";
import { User } from "@/modules/auth/models/user";
import type { SignupInput } from "@/modules/auth/signup-schema";

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailAlreadyExistsError";
  }
}

export async function signup(input: SignupInput) {
  await connectToDatabase();

  const email = input.email.trim();
  const emailNormalized = email.toLowerCase();
  const passwordHash = await hash(input.password, 12);

  let user;
  try {
    user = await User.create({
      name: input.name.trim(),
      email,
      emailNormalized,
      passwordHash,
    });
  } catch (error) {
    if (
      typeof error === "object" && error !== null && "code" in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      throw new EmailAlreadyExistsError();
    }
    throw error;
  }

  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await Session.create({ userId: user._id, tokenHash, expiresAt });

  return {
    token,
    expiresAt,
    user: { id: user._id.toString(), name: user.name, email: user.email },
    hasWedding: false,
  };
}
