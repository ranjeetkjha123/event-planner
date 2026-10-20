import assert from "node:assert/strict";
import test from "node:test";

import { createWeddingSchema } from "../src/modules/weddings/create-wedding-schema.ts";

const validWedding = {
  brideName: "Aanya",
  groomName: "Rohan",
  weddingDate: "2027-02-14",
  timeZone: "Asia/Kolkata",
  location: { city: "Jaipur", formattedAddress: "Jaipur, Rajasthan" },
};

test("wedding creation accepts valid date, time zone and location", () => {
  assert.equal(createWeddingSchema.safeParse(validWedding).success, true);
});

test("wedding creation rejects impossible dates, unknown time zones and untrusted fields", () => {
  assert.equal(createWeddingSchema.safeParse({ ...validWedding, weddingDate: "2027-02-30" }).success, false);
  assert.equal(createWeddingSchema.safeParse({ ...validWedding, timeZone: "Not/A_Timezone" }).success, false);
  assert.equal(createWeddingSchema.safeParse({ ...validWedding, weddingId: "client-selected" }).success, false);
});
