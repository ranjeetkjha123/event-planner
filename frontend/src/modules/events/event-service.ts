import "server-only";

import { Types } from "mongoose";

import { Event } from "@/modules/events/models/event";
import type { CreateEventInput, UpdateEventInput } from "@/modules/events/event-schema";
import { canWriteWeddingContent } from "@/modules/memberships/role-permissions";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { connectToDatabase } from "@/server/database/connection";

export class WeddingMembershipRequiredError extends Error {
  constructor() { super("Wedding workspace not found."); this.name = "WeddingMembershipRequiredError"; }
}
export class WeddingReadOnlyError extends Error {
  constructor() { super("Your Viewer role has read-only access to this wedding."); this.name = "WeddingReadOnlyError"; }
}
export class EventNotFoundError extends Error {
  constructor() { super("Event not found."); this.name = "EventNotFoundError"; }
}
export class EventConflictError extends Error {
  constructor() { super("This event changed while you were editing it. Reload and try again."); this.name = "EventConflictError"; }
}

function eventDto(event: { _id: unknown; name: string; type?: string; startsAt: Date; endsAt?: Date; venueName?: string; address?: string; description?: string; dressCode?: string }) {
  return { id: String(event._id), name: event.name, type: event.type ?? null, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt?.toISOString() ?? null, venueName: event.venueName ?? "", address: event.address ?? "", description: event.description ?? "", dressCode: event.dressCode ?? "" };
}

export async function createWeddingEvent(userId: string, input: CreateEventInput) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) throw new WeddingMembershipRequiredError();
  if (!canWriteWeddingContent(membership.role)) throw new WeddingReadOnlyError();
  const [event] = await Event.create([{
    weddingId: membership.weddingId,
    name: input.name,
    type: input.type,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    venueName: input.venueName,
    address: input.address,
    description: input.description,
    dressCode: input.dressCode,
  }]);
  return eventDto(event);
}

export async function listWeddingEvents(userId: string) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) return [];
  const events = await Event.find({ weddingId: membership.weddingId, archivedAt: null }).sort({ startsAt: 1, _id: 1 }).lean();
  return events.map(eventDto);
}

export async function updateWeddingEvent(userId: string, eventId: string, input: UpdateEventInput) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) throw new WeddingMembershipRequiredError();
  if (!canWriteWeddingContent(membership.role)) throw new WeddingReadOnlyError();

  const event = await Event.findOne({ _id: new Types.ObjectId(eventId), weddingId: membership.weddingId, archivedAt: null });
  if (!event) throw new EventNotFoundError();
  const startsAt = input.startsAt === undefined ? event.startsAt : new Date(input.startsAt);
  const endsAt = input.endsAt === undefined ? event.endsAt : input.endsAt === null ? undefined : new Date(input.endsAt);
  if (endsAt && endsAt <= startsAt) throw new RangeError("End time must be after start time.");

  const patch: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const key of ["name", "type", "venueName", "address", "description", "dressCode"] as const) {
    if (input[key] !== undefined) {
      if (input[key] === "") unset[key] = "";
      else patch[key] = input[key];
    }
  }
  if (input.startsAt !== undefined) patch.startsAt = startsAt;
  if (input.endsAt !== undefined) {
    if (endsAt) patch.endsAt = endsAt;
    else unset.endsAt = "";
  }
  const update: Record<string, unknown> = { $inc: { __v: 1 } };
  if (Object.keys(patch).length) update.$set = patch;
  if (Object.keys(unset).length) update.$unset = unset;
  const updated = await Event.findOneAndUpdate(
    { _id: event._id, weddingId: membership.weddingId, archivedAt: null, __v: event.__v },
    update,
    { returnDocument: "after", runValidators: true },
  ).lean();
  if (updated) return eventDto(updated);
  const stillActive = await Event.exists({ _id: event._id, weddingId: membership.weddingId, archivedAt: null });
  if (!stillActive) throw new EventNotFoundError();
  throw new EventConflictError();
}

export async function archiveWeddingEvent(userId: string, eventId: string) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) throw new WeddingMembershipRequiredError();
  if (!canWriteWeddingContent(membership.role)) throw new WeddingReadOnlyError();
  const event = await Event.findOneAndUpdate(
    { _id: new Types.ObjectId(eventId), weddingId: membership.weddingId, archivedAt: null },
    { $set: { archivedAt: new Date() }, $inc: { __v: 1 } },
  );
  if (!event) throw new EventNotFoundError();
}
