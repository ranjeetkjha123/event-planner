import { Types } from "mongoose";

import type { ListTasksQuery } from "@/modules/tasks/task-schema";

export function buildWeddingTaskFilter(weddingId: string, membershipId: string, query: ListTasksQuery) {
  const filter: Record<string, unknown> = { weddingId: new Types.ObjectId(weddingId) };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.eventId) filter.eventId = query.eventId === "none" ? { $exists: false } : new Types.ObjectId(query.eventId);
  const assigneeFilters: Record<string, unknown>[] = [];
  if (query.mine) assigneeFilters.push({ assignedMembershipId: new Types.ObjectId(membershipId) });
  if (query.assignedMembershipId) assigneeFilters.push({ assignedMembershipId: query.assignedMembershipId === "none" ? { $exists: false } : new Types.ObjectId(query.assignedMembershipId) });
  if (assigneeFilters.length === 1) Object.assign(filter, assigneeFilters[0]);
  if (assigneeFilters.length > 1) filter.$and = assigneeFilters;
  return filter;
}
