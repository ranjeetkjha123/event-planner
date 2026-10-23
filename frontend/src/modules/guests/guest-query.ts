import { Types } from "mongoose";

import type { ListGuestsQuery } from "@/modules/guests/guest-schema";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildWeddingGuestFilter(weddingId: Types.ObjectId, query: ListGuestsQuery) {
  const filter: Record<string, unknown> = { weddingId };
  if (query.rsvpStatus) filter.rsvpStatus = query.rsvpStatus;
  if (query.eventId) filter.invitedEventIds = new Types.ObjectId(query.eventId);
  if (query.invitationSent !== undefined) filter.invitationSentAt = query.invitationSent ? { $ne: null } : null;
  if (query.search) {
    const search = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }
  return filter;
}

export function buildGuestUpdateFilter(input: {
  guestId: Types.ObjectId;
  weddingId: Types.ObjectId;
  version: number;
  maxGuests?: number;
}) {
  const filter: Record<string, unknown> = {
    _id: input.guestId,
    weddingId: input.weddingId,
    __v: input.version,
  };
  if (input.maxGuests !== undefined) {
    filter.$or = [
      { attendingCount: null },
      { attendingCount: { $lte: input.maxGuests } },
    ];
  }
  return filter;
}
