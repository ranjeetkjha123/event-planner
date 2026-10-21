import "server-only";

import { Types } from "mongoose";

import { Event } from "@/modules/events/models/event";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { connectToDatabase } from "@/server/database/connection";

export class WeddingMembershipRequiredError extends Error {
  constructor() { super("Wedding workspace not found."); this.name = "WeddingMembershipRequiredError"; }
}

export async function createWeddingEvent(userId: string, input: { name: string; type?: string; startsAt: string }) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) throw new WeddingMembershipRequiredError();
  const [event] = await Event.create([{ weddingId: membership.weddingId, name: input.name, type: input.type, startsAt: new Date(input.startsAt) }]);
  return { id: event._id.toString(), name: event.name, type: event.type, startsAt: event.startsAt.toISOString() };
}

export async function listWeddingEvents(userId: string) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) return [];
  const events = await Event.find({ weddingId: membership.weddingId, archivedAt: null }).sort({ startsAt: 1, _id: 1 }).lean();
  return events.map((event) => ({ id: event._id.toString(), name: event.name, type: event.type, startsAt: event.startsAt.toISOString() }));
}
