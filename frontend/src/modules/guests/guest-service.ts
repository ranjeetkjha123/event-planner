import "server-only";

import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { Event } from "@/modules/events/models/event";
import { Guest } from "@/modules/guests/models/guest";
import { buildGuestUpdateFilter, buildWeddingGuestFilter } from "@/modules/guests/guest-query";
import type { CreateGuestInput, ListGuestsQuery, UpdateGuestInput } from "@/modules/guests/guest-schema";
import { canWriteWeddingContent } from "@/modules/memberships/role-permissions";
import { getWeddingMembershipForUser } from "@/modules/memberships/membership-service";
import { connectToDatabase } from "@/server/database/connection";

export class GuestServiceError extends Error {
  constructor(readonly code: "WORKSPACE_REQUIRED" | "READ_ONLY" | "NOT_FOUND" | "EVENT_INVALID" | "CAPACITY_CONFLICT" | "CONFLICT", message: string) {
    super(message);
    this.name = "GuestServiceError";
  }
}

type GuestRecord = {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  maxGuests: number;
  invitedEventIds: Types.ObjectId[];
  notes?: string;
  invitationSentAt?: Date;
  lastReminderSentAt?: Date;
  reminderCount: number;
  rsvpStatus: "PENDING" | "ATTENDING" | "NOT_ATTENDING";
  attendingCount?: number | null;
  rsvpUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
};

async function getMembership(userId: string) {
  await connectToDatabase();
  const membership = await getWeddingMembershipForUser(userId);
  if (!membership) throw new GuestServiceError("WORKSPACE_REQUIRED", "Wedding workspace not found.");
  return { ...membership, weddingObjectId: new Types.ObjectId(membership.weddingId) };
}

function assertCanWrite(role: string) {
  if (!canWriteWeddingContent(role as "ADMIN" | "MANAGER" | "VIEWER")) {
    throw new GuestServiceError("READ_ONLY", "Your Viewer role has read-only access to wedding guests.");
  }
}

function normalizedEmail(email: string | undefined) {
  const value = email?.trim().toLowerCase();
  return value || undefined;
}

function displayEmail(email: string | undefined) {
  const value = email?.trim();
  return value || undefined;
}

async function assertActiveEvents(eventIds: string[], weddingId: Types.ObjectId, previousIds: string[] = []) {
  const newIds = [...new Set(eventIds)].filter((id) => !previousIds.includes(id));
  if (!newIds.length) return;
  const active = await Event.find({ _id: { $in: newIds.map((id) => new Types.ObjectId(id)) }, weddingId, archivedAt: null }).select("_id").lean();
  if (active.length !== newIds.length) throw new GuestServiceError("EVENT_INVALID", "Choose active events from this wedding.");
}

async function toGuestDtos(guests: GuestRecord[], weddingId: Types.ObjectId) {
  const eventIds = [...new Set(guests.flatMap((guest) => guest.invitedEventIds.map((id) => id.toString())))];
  const events = eventIds.length ? await Event.find({ _id: { $in: eventIds.map((id) => new Types.ObjectId(id)) }, weddingId }).select("name startsAt archivedAt").lean() : [];
  const eventById = new Map(events.map((event) => [event._id.toString(), event]));
  return guests.map((guest) => ({
    id: guest._id.toString(),
    name: guest.name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    maxGuests: guest.maxGuests,
    invitedEventIds: guest.invitedEventIds.map((id) => id.toString()),
    invitedEvents: guest.invitedEventIds.flatMap((id) => {
      const event = eventById.get(id.toString());
      return event ? [{ id: id.toString(), name: event.name, startsAt: event.startsAt.toISOString(), archivedAt: event.archivedAt?.toISOString() ?? null }] : [];
    }),
    notes: guest.notes ?? "",
    rsvpStatus: guest.rsvpStatus,
    attendingCount: guest.attendingCount ?? null,
    invitationSentAt: guest.invitationSentAt?.toISOString() ?? null,
    lastReminderSentAt: guest.lastReminderSentAt?.toISOString() ?? null,
    reminderCount: guest.reminderCount,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
  }));
}

export async function listWeddingGuests(userId: string, query: ListGuestsQuery) {
  const membership = await getMembership(userId);
  const filter = buildWeddingGuestFilter(membership.weddingObjectId, query);
  const [items, total] = await Promise.all([
    Guest.find(filter).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Guest.countDocuments(filter),
  ]);
  return { data: await toGuestDtos(items as GuestRecord[], membership.weddingObjectId), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function getWeddingGuest(userId: string, guestId: string) {
  const membership = await getMembership(userId);
  const guest = await Guest.findOne({ _id: new Types.ObjectId(guestId), weddingId: membership.weddingObjectId }).lean() as GuestRecord | null;
  if (!guest) throw new GuestServiceError("NOT_FOUND", "Guest not found.");
  return (await toGuestDtos([guest], membership.weddingObjectId))[0];
}

export async function createWeddingGuest(userId: string, input: CreateGuestInput) {
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  await assertActiveEvents(input.invitedEventIds, membership.weddingObjectId);
  const email = displayEmail(input.email);
  const [guest] = await Guest.create([{
    weddingId: membership.weddingObjectId,
    name: input.name,
    email,
    emailNormalized: normalizedEmail(email),
    phone: input.phone || undefined,
    maxGuests: input.maxGuests,
    invitedEventIds: input.invitedEventIds.map((id) => new Types.ObjectId(id)),
    notes: input.notes || undefined,
    invitationToken: randomBytes(32).toString("base64url"),
    rsvpStatus: "PENDING",
    attendingCount: null,
  }]);
  return (await toGuestDtos([guest.toObject() as GuestRecord], membership.weddingObjectId))[0];
}

export async function updateWeddingGuest(userId: string, guestId: string, input: UpdateGuestInput) {
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  const guest = await Guest.findOne({ _id: new Types.ObjectId(guestId), weddingId: membership.weddingObjectId }).lean() as GuestRecord | null;
  if (!guest) throw new GuestServiceError("NOT_FOUND", "Guest not found.");

  if (input.maxGuests !== undefined && input.maxGuests < (guest.attendingCount ?? 0)) {
    throw new GuestServiceError("CAPACITY_CONFLICT", "Guest limit cannot be lower than the number already attending.");
  }
  if (input.invitedEventIds) await assertActiveEvents(input.invitedEventIds, membership.weddingObjectId, guest.invitedEventIds.map((id) => id.toString()));

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.email !== undefined) {
    const email = normalizedEmail(input.email);
    if (email) { set.email = displayEmail(input.email); set.emailNormalized = email; }
    else { unset.email = ""; unset.emailNormalized = ""; }
  }
  if (input.phone !== undefined) {
    if (input.phone) set.phone = input.phone;
    else unset.phone = "";
  }
  if (input.maxGuests !== undefined) set.maxGuests = input.maxGuests;
  if (input.invitedEventIds !== undefined) set.invitedEventIds = input.invitedEventIds.map((id) => new Types.ObjectId(id));
  if (input.notes !== undefined) {
    if (input.notes) set.notes = input.notes;
    else unset.notes = "";
  }

  const update: Record<string, unknown> = { $set: set, $inc: { __v: 1 } };
  if (Object.keys(unset).length) update.$unset = unset;
  const updated = await Guest.findOneAndUpdate(
    buildGuestUpdateFilter({ guestId: guest._id, weddingId: membership.weddingObjectId, version: guest.__v, maxGuests: input.maxGuests }),
    update,
    { returnDocument: "after", runValidators: true },
  ).lean() as GuestRecord | null;
  if (!updated) {
    const exists = await Guest.exists({ _id: guest._id, weddingId: membership.weddingObjectId });
    if (!exists) throw new GuestServiceError("NOT_FOUND", "Guest not found.");
    throw new GuestServiceError("CONFLICT", "This guest changed while you were editing. Reload and try again.");
  }
  return (await toGuestDtos([updated], membership.weddingObjectId))[0];
}

export async function deleteWeddingGuest(userId: string, guestId: string) {
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  const result = await Guest.deleteOne({ _id: new Types.ObjectId(guestId), weddingId: membership.weddingObjectId });
  if (!result.deletedCount) throw new GuestServiceError("NOT_FOUND", "Guest not found.");
}
