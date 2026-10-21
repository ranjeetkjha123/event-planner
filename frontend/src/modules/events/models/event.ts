import "server-only";

import { Schema, model, models } from "mongoose";

const eventSchema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding", index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["ROKA", "ENGAGEMENT", "MEHENDI", "HALDI", "SANGEET", "COCKTAIL", "WEDDING", "RECEPTION", "CUSTOM"] },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date },
  venueName: { type: String },
  address: { type: String },
  description: { type: String },
  dressCode: { type: String },
  coverImageObjectKey: { type: String },
  archivedAt: { type: Date },
}, { timestamps: true, collection: "events" });

eventSchema.index({ weddingId: 1, startsAt: 1 });

export const Event = models.Event ?? model("Event", eventSchema);
