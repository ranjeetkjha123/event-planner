import "server-only";

import { Schema, model, models } from "mongoose";

const memberInvitationSchema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  email: { type: String, required: true, trim: true },
  emailNormalized: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, required: true, enum: ["ADMIN", "MANAGER", "VIEWER"] },
  tokenHash: { type: String, required: true, unique: true, select: false },
  status: { type: String, required: true, enum: ["PENDING", "ACCEPTED", "REVOKED"], default: "PENDING" },
  invitedByUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  acceptedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
}, { timestamps: true, collection: "wedding_member_invitations" });

memberInvitationSchema.index({ weddingId: 1, emailNormalized: 1 }, { unique: true, partialFilterExpression: { status: "PENDING" } });
memberInvitationSchema.index({ weddingId: 1, status: 1 });
memberInvitationSchema.index({ emailNormalized: 1 });

export const WeddingMemberInvitation = models.WeddingMemberInvitation ?? model("WeddingMemberInvitation", memberInvitationSchema);
