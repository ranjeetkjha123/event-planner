import assert from "node:assert/strict";
import test from "node:test";

import { createEventSchema, updateEventSchema } from "../src/modules/events/event-schema.ts";
import { localDateTimeToIso } from "../src/modules/events/event-time.ts";

test("event creation validates dates and rejects caller-selected wedding scope", () => {
  assert.equal(createEventSchema.safeParse({ name: "Mehendi", startsAt: "2027-02-12T10:30:00+05:30" }).success, true);
  assert.equal(createEventSchema.safeParse({ name: "", startsAt: "invalid" }).success, false);
  assert.equal(createEventSchema.safeParse({ name: "Wedding", startsAt: "2027-02-14T10:00:00Z", weddingId: "bad" }).success, false);
});

test("wedding local event times convert using the selected time zone", () => {
  assert.equal(localDateTimeToIso("2027-02-14", "10:00", "Asia/Kolkata"), "2027-02-14T04:30:00.000Z");
  assert.equal(localDateTimeToIso("2027-02-14", "10:00", "America/New_York"), "2027-02-14T15:00:00.000Z");
  assert.throws(() => localDateTimeToIso("2027-02-30", "10:00", "Asia/Kolkata"), RangeError);
  assert.throws(() => localDateTimeToIso("2027-03-14", "02:30", "America/New_York"), RangeError);
});

test("event updates accept partial fields and clearing the optional end time", () => {
  assert.equal(updateEventSchema.safeParse({ name: "Updated reception" }).success, true);
  assert.equal(updateEventSchema.safeParse({ endsAt: null }).success, true);
  assert.equal(updateEventSchema.safeParse({ endsAt: "2027-02-12T14:30:00Z" }).success, true);
  assert.equal(updateEventSchema.safeParse({}).success, false);
  assert.equal(updateEventSchema.safeParse({ weddingId: "not-client-controlled" }).success, false);
});
