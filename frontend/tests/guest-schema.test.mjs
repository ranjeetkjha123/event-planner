import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import { createGuestSchema, listGuestsQuerySchema, updateGuestSchema } from "../src/modules/guests/guest-schema.ts";
import { buildGuestUpdateFilter, buildWeddingGuestFilter } from "../src/modules/guests/guest-query.ts";

test("guest creation trims fields and defaults party size, events, and RSVP-compatible fields", () => {
  assert.deepEqual(createGuestSchema.parse({ name: "  Asha Family  " }), {
    name: "Asha Family", maxGuests: 1, invitedEventIds: [],
  });
});

test("guest schemas validate emails, party limits, event IDs, and server-owned fields", () => {
  assert.equal(createGuestSchema.safeParse({ name: "Guest", email: "bad" }).success, false);
  assert.equal(createGuestSchema.safeParse({ name: "Guest", maxGuests: 0 }).success, false);
  assert.equal(createGuestSchema.safeParse({ name: "Guest", invitedEventIds: ["not-an-object-id"] }).success, false);
  assert.equal(createGuestSchema.safeParse({ name: "Guest", weddingId: "caller-selected" }).success, false);
  assert.equal(updateGuestSchema.safeParse({}).success, false);
  assert.equal(updateGuestSchema.safeParse({ rsvpStatus: "ATTENDING" }).success, false);
  assert.equal(updateGuestSchema.safeParse({ email: "", phone: "", notes: "", invitedEventIds: [] }).success, true);
});

test("guest list filters keep tenant scope and escape literal search terms", () => {
  const weddingId = "507f1f77bcf86cd799439011";
  const eventId = "507f1f77bcf86cd799439012";
  const query = listGuestsQuerySchema.parse({ search: "Asha.+", rsvpStatus: "PENDING", eventId, invitationSent: "false" });
  const filter = buildWeddingGuestFilter(new mongoose.Types.ObjectId(weddingId), query);

  assert.equal(filter.weddingId.toString(), weddingId);
  assert.equal(filter.rsvpStatus, "PENDING");
  assert.equal(filter.invitedEventIds.toString(), eventId);
  assert.equal(filter.invitationSentAt, null);
  assert.equal(filter.$or[0].name.source, String.raw`Asha\.\+`);
});

test("guest updates guard tenant, version, and capacity while allowing null RSVP attendance", () => {
  const weddingId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
  const guestId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
  const filter = buildGuestUpdateFilter({ guestId, weddingId, version: 3, maxGuests: 4 });

  assert.equal(filter._id.toString(), guestId.toString());
  assert.equal(filter.weddingId.toString(), weddingId.toString());
  assert.equal(filter.__v, 3);
  assert.equal(filter.$or[0].attendingCount, null);
  assert.deepEqual(filter.$or[1], { attendingCount: { $lte: 4 } });
  assert.equal("$or" in buildGuestUpdateFilter({ guestId, weddingId, version: 3 }), false);
});
