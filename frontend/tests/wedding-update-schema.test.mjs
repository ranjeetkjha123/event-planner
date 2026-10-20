import assert from "node:assert/strict";
import test from "node:test";

import { updateWeddingSchema } from "../src/modules/weddings/update-wedding-schema.ts";

test("wedding updates accept a partial documented detail set", () => {
  assert.equal(updateWeddingSchema.safeParse({ brideName: "Aanya" }).success, true);
  assert.equal(updateWeddingSchema.safeParse({ location: { city: "Jaipur", formattedAddress: "Jaipur, Rajasthan" } }).success, true);
  assert.equal(updateWeddingSchema.safeParse({ title: "" }).success, true);
});

test("wedding updates reject empty, invalid, and client-selected tenant data", () => {
  assert.equal(updateWeddingSchema.safeParse({}).success, false);
  assert.equal(updateWeddingSchema.safeParse({ weddingDate: "2027-02-30" }).success, false);
  assert.equal(updateWeddingSchema.safeParse({ weddingId: "another-wedding", brideName: "Aanya" }).success, false);
});
