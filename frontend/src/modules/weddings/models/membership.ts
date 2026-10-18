import "server-only";

import { Schema, model, models } from "mongoose";

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    role: { type: String, required: true, enum: ["ADMIN", "MANAGER"] },
    joinedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "wedding_memberships" },
);

membershipSchema.index({ userId: 1 }, { unique: true });

export const WeddingMembership =
  models.WeddingMembership ?? model("WeddingMembership", membershipSchema);
