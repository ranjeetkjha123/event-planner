import assert from "node:assert/strict";
import test from "node:test";

import { canWriteWeddingContent } from "../src/modules/memberships/role-permissions.ts";

test("Viewer can read but cannot write wedding content", () => {
  assert.equal(canWriteWeddingContent("VIEWER"), false);
  assert.equal(canWriteWeddingContent("ADMIN"), true);
  assert.equal(canWriteWeddingContent("MANAGER"), true);
});
