import assert from "node:assert/strict";
import test from "node:test";

import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "../src/modules/tasks/task-schema.ts";
import { buildWeddingTaskFilter } from "../src/modules/tasks/task-query.ts";

test("task creation trims the title and defaults status and priority", () => {
  assert.deepEqual(createTaskSchema.parse({ title: "  Book photographer  " }), {
    title: "Book photographer", priority: "MEDIUM", status: "TODO",
  });
});

test("task creation rejects blank titles, invalid ObjectIds, and unsupported fields", () => {
  assert.equal(createTaskSchema.safeParse({ title: "  " }).success, false);
  assert.equal(createTaskSchema.safeParse({ title: "Confirm venue", eventId: "bad-id" }).success, false);
  assert.equal(createTaskSchema.safeParse({ title: "Confirm venue", weddingId: "caller-controlled" }).success, false);
});

test("task updates require a supported field and allow clearing optional references", () => {
  assert.equal(updateTaskSchema.safeParse({}).success, false);
  assert.deepEqual(updateTaskSchema.parse({ assignedMembershipId: null, eventId: null, dueDate: null }), {
    assignedMembershipId: null, eventId: null, dueDate: null,
  });
});

test("task list query validates filters and defaults pagination", () => {
  assert.deepEqual(listTasksQuerySchema.parse({ mine: "true", status: "IN_PROGRESS", page: "2" }), {
    page: 2, limit: 20, mine: true, status: "IN_PROGRESS",
  });
  assert.equal(listTasksQuerySchema.safeParse({ assignedMembershipId: "invalid" }).success, false);
  assert.equal(listTasksQuerySchema.safeParse({ status: "CANCELED" }).success, false);
});

test("task list filters always scope to the active wedding and combine assignee constraints", () => {
  const weddingId = "507f1f77bcf86cd799439011";
  const membershipId = "507f1f77bcf86cd799439012";
  const anotherMemberId = "507f1f77bcf86cd799439013";
  const query = listTasksQuerySchema.parse({ mine: "true", assignedMembershipId: anotherMemberId, eventId: "none" });
  const filter = buildWeddingTaskFilter(weddingId, membershipId, query);

  assert.equal(filter.weddingId.toString(), weddingId);
  assert.deepEqual(filter.eventId, { $exists: false });
  assert.equal(filter.$and[0].assignedMembershipId.toString(), membershipId);
  assert.equal(filter.$and[1].assignedMembershipId.toString(), anotherMemberId);
});
