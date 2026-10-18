import "server-only";

import { Schema, model, models } from "mongoose";

const weddingSchema = new Schema(
  {
    brideName: { type: String, required: true },
    groomName: { type: String, required: true },
    weddingDate: { type: String, required: true },
  },
  { timestamps: true, collection: "weddings" },
);

export const Wedding = models.Wedding ?? model("Wedding", weddingSchema);
