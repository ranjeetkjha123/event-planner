import "server-only";

import { compare } from "bcryptjs";

import { connectToDatabase } from "@/server/database/connection";
import { createSessionToken, SESSION_DURATION_SECONDS } from "@/server/auth/session-token";
import { Session } from "@/modules/auth/models/session";
import { User } from "@/modules/auth/models/user";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import type { LoginInput } from "@/modules/auth/login-schema";

const DUMMY_PASSWORD_HASH = "$2b$12$m7bol/0itjWKDvE1PzJ6s.Y0k77eXjsFgmyFKvy5F9wBROvLXLRx2";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export async function login(input: LoginInput) {
  await connectToDatabase();

  const emailNormalized = input.email.toLowerCase();
  const user = await User.findOne({ emailNormalized }).select("+passwordHash");
  const passwordMatches = await compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  const membership = await WeddingMembership.findOne({ userId: user._id })
    .select("_id")
    .lean();
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await Session.create({ userId: user._id, tokenHash, expiresAt });

  return {
    token,
    expiresAt,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    hasWedding: Boolean(membership),
  };
}
