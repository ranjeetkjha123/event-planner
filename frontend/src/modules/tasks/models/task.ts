import "server-only";

import { model, models, Schema } from "mongoose";

const taskSchema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  assignedMembershipId: { type: Schema.Types.ObjectId, ref: "WeddingMembership" },
  eventId: { type: Schema.Types.ObjectId, ref: "Event" },
  dueDate: { type: Date },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true, default: "MEDIUM" },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "COMPLETED"], required: true, default: "TODO" },
  completedAt: { type: Date },
}, { timestamps: true, collection: "tasks" });

taskSchema.index({ weddingId: 1, status: 1 });
taskSchema.index({ weddingId: 1, dueDate: 1 });
taskSchema.index({ weddingId: 1, assignedMembershipId: 1, status: 1 });
taskSchema.index({ weddingId: 1, eventId: 1 });

export const Task = models.Task ?? model("Task", taskSchema);
