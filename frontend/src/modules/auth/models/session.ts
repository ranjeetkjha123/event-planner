import "server-only";

import { Schema, model, models } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "sessions" },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = models.Session ?? model("Session", sessionSchema);
