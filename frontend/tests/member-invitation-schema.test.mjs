import assert from "node:assert/strict";
import test from "node:test";

import { createMemberInvitationSchema, tokenSchema, updateMemberRoleSchema } from "../src/modules/memberships/invitation-schema.ts";

test("member invitation accepts a valid email and defaults role to viewer", () => {
  assert.deepEqual(createMemberInvitationSchema.parse({ email: "family@example.com" }), { email: "family@example.com", role: "VIEWER" });
});

test("member invitation rejects invalid email and extra fields; tokens require high entropy shape", () => {
  assert.equal(createMemberInvitationSchema.safeParse({ email: "nope", role: "MANAGER" }).success, false);
  assert.equal(createMemberInvitationSchema.safeParse({ email: "family@example.com", weddingId: "client" }).success, false);
  assert.equal(tokenSchema.safeParse("short").success, false);
  assert.equal(tokenSchema.safeParse("A".repeat(43)).success, true);
});

test("member role updates accept Admin, Manager, or Viewer", () => {
  assert.deepEqual(updateMemberRoleSchema.parse({ role: "ADMIN" }), { role: "ADMIN" });
  assert.deepEqual(updateMemberRoleSchema.parse({ role: "MANAGER" }), { role: "MANAGER" });
  assert.deepEqual(updateMemberRoleSchema.parse({ role: "VIEWER" }), { role: "VIEWER" });
  assert.equal(updateMemberRoleSchema.safeParse({ role: "OWNER" }).success, false);
  assert.equal(updateMemberRoleSchema.safeParse({ role: "MANAGER", weddingId: "client" }).success, false);
});
