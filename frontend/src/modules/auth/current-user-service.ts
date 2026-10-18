import "server-only";

import { connectToDatabase } from "@/server/database/connection";
import { hashSessionToken } from "@/server/auth/session-token";
import { Session } from "@/modules/auth/models/session";
import { User } from "@/modules/auth/models/user";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { Wedding } from "@/modules/weddings/models/wedding";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "UnauthenticatedError";
  }
}

export async function getCurrentUser(token: string | undefined) {
  if (!token) throw new UnauthenticatedError();

  await connectToDatabase();
  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");

  if (!session) throw new UnauthenticatedError();

  const user = await User.findById(session.userId).select("name email").lean();
  if (!user) throw new UnauthenticatedError();

  const membership = await WeddingMembership.findOne({ userId: user._id }).lean();
  const wedding = membership
    ? await Wedding.findById(membership.weddingId)
        .select("brideName groomName weddingDate")
        .lean()
    : null;

  await Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    membership: membership ? { role: membership.role } : null,
    wedding: wedding
      ? {
          id: wedding._id.toString(),
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: wedding.weddingDate,
        }
      : null,
  };
}
