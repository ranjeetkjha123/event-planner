import "server-only";

import mongoose, { Types } from "mongoose";

import { connectToDatabase } from "@/server/database/connection";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { Wedding } from "@/modules/weddings/models/wedding";

export class MembershipError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "MembershipError"; }
}

export async function updateWeddingMemberRole(input: {
  weddingId: string;
  membershipId: string;
  actorUserId: string;
  role: "ADMIN" | "MANAGER" | "VIEWER";
}) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(input.membershipId)) throw new MembershipError("NOT_FOUND", "Wedding member not found.");

  const weddingId = new Types.ObjectId(input.weddingId);
  const membershipId = new Types.ObjectId(input.membershipId);
  const actorUserId = new Types.ObjectId(input.actorUserId);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Serialize role changes for this wedding so concurrent Admin demotions
      // cannot both observe themselves as the last Admin.
      const weddingWrite = await Wedding.updateOne({ _id: weddingId }, { $inc: { __v: 1 } }, { session });
      if (!weddingWrite.matchedCount) throw new MembershipError("NOT_FOUND", "Wedding workspace not found.");

      const actor = await WeddingMembership.findOne({ weddingId, userId: actorUserId, role: "ADMIN" }).session(session);
      if (!actor) throw new MembershipError("FORBIDDEN", "Only wedding Admins can change member roles.");

      const target = await WeddingMembership.findOne({ _id: membershipId, weddingId }).session(session);
      if (!target) throw new MembershipError("NOT_FOUND", "Wedding member not found.");
      if (target.role === input.role) return;

      if (target.role === "ADMIN" && input.role !== "ADMIN") {
        const adminCount = await WeddingMembership.countDocuments({ weddingId, role: "ADMIN" }).session(session);
        if (adminCount <= 1) throw new MembershipError("LAST_ADMIN", "This wedding must keep at least one Admin.");
      }

      target.role = input.role;
      await target.save({ session });
    });
  } catch (error) {
    if (error instanceof MembershipError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new MembershipError("NOT_FOUND", "Wedding member not found.");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
