import "server-only";

import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    emailNormalized: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, collection: "users" },
);

userSchema.index({ emailNormalized: 1 }, { unique: true });

export const User = models.User ?? model("User", userSchema);
