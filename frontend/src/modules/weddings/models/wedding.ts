import "server-only";

import { Schema, model, models } from "mongoose";

const weddingSchema = new Schema(
  {
    brideName: { type: String, required: true },
    groomName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    weddingDate: { type: String, required: true },
    timeZone: { type: String, required: true },
    location: {
      formattedAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      latitude: { type: Number },
      longitude: { type: Number },
      googlePlaceId: { type: String },
    },
    website: {
      slug: { type: String, required: true, unique: true },
      theme: { type: String, default: "Classic" },
      isPublished: { type: Boolean, default: false },
      welcomeMessage: { type: String, default: "" },
    },
    gallery: {
      token: { type: String, required: true, unique: true, select: false },
      isEnabled: { type: Boolean, default: false },
      guestUploadsEnabled: { type: Boolean, default: false },
    },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true, collection: "weddings" },
);

export const Wedding = models.Wedding ?? model("Wedding", weddingSchema);
