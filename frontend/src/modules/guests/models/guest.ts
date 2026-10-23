import "server-only";

import { model, models, Schema } from "mongoose";

const guestSchema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, maxlength: 254 },
  emailNormalized: { type: String, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  maxGuests: { type: Number, required: true, min: 1, max: 10_000, default: 1 },
  invitedEventIds: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  notes: { type: String, trim: true, maxlength: 2_000 },
  invitationToken: { type: String, required: true, select: false },
  invitationSentAt: { type: Date },
  lastReminderSentAt: { type: Date },
  reminderCount: { type: Number, required: true, default: 0 },
  rsvpStatus: { type: String, enum: ["PENDING", "ATTENDING", "NOT_ATTENDING"], required: true, default: "PENDING" },
  attendingCount: { type: Number, default: null },
  rsvpUpdatedAt: { type: Date },
}, { timestamps: true, collection: "guests" });

guestSchema.index({ invitationToken: 1 }, { unique: true });
guestSchema.index({ weddingId: 1, rsvpStatus: 1 });
guestSchema.index({ weddingId: 1, name: 1 });
guestSchema.index({ weddingId: 1, emailNormalized: 1 });
guestSchema.index({ weddingId: 1, invitedEventIds: 1 });

export const Guest = models.Guest ?? model("Guest", guestSchema);
