import "server-only";

import { Schema, model, models } from "mongoose";

const authRateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "auth_rate_limits" },
);

authRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthRateLimit = models.AuthRateLimit ?? model("AuthRateLimit", authRateLimitSchema);
