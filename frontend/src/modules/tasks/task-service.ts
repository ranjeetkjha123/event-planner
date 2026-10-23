import "server-only";

import { Types } from "mongoose";

import { getWeddingEventSummaries, isActiveWeddingEvent } from "@/modules/events/event-service";
import { Task } from "@/modules/tasks/models/task";
import { buildWeddingTaskFilter } from "@/modules/tasks/task-query";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@/modules/tasks/task-schema";
import { canWriteWeddingContent } from "@/modules/memberships/role-permissions";
import { listWeddingTaskAssignees } from "@/modules/memberships/invitation-service";
import { getWeddingMembershipForUser, isWeddingMember } from "@/modules/memberships/membership-service";
import { connectToDatabase } from "@/server/database/connection";

export class TaskServiceError extends Error {
  constructor(readonly code: "NOT_FOUND" | "WORKSPACE_REQUIRED" | "READ_ONLY" | "ASSIGNEE_INVALID" | "EVENT_INVALID" | "CONFLICT", message: string) {
    super(message);
    this.name = "TaskServiceError";
  }
}

function localTodayStart(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  const desired = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  let candidate = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    candidate += desired - Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  }
  return new Date(candidate);
}

type TaskRecord = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  assignedMembershipId?: Types.ObjectId;
  eventId?: Types.ObjectId;
  dueDate?: Date;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

async function getMembership(userId: string) {
  const membership = await getWeddingMembershipForUser(userId);
  if (!membership) throw new TaskServiceError("WORKSPACE_REQUIRED", "Wedding workspace not found.");
  return { ...membership, _id: new Types.ObjectId(membership.id), weddingId: new Types.ObjectId(membership.weddingId) };
}

function assertCanWrite(role: string) {
  if (!canWriteWeddingContent(role as "ADMIN" | "MANAGER" | "VIEWER")) {
    throw new TaskServiceError("READ_ONLY", "Your Viewer role has read-only access to this wedding.");
  }
}

async function summaries(tasks: TaskRecord[], weddingId: Types.ObjectId) {
  const membershipIds = [...new Set(tasks.flatMap((task) => task.assignedMembershipId ? [task.assignedMembershipId.toString()] : []))];
  const eventIds = [...new Set(tasks.flatMap((task) => task.eventId ? [task.eventId.toString()] : []))];
  const [memberships, events] = await Promise.all([
    membershipIds.length ? listWeddingTaskAssignees(weddingId.toString(), membershipIds) : [],
    eventIds.length ? getWeddingEventSummaries(weddingId.toString(), eventIds) : [],
  ]);
  const memberById = new Map(memberships.map((member) => [member.membershipId, member]));
  const eventById = new Map(events.map((event) => [event.id, event]));
  return tasks.map((task) => {
    const member = task.assignedMembershipId ? memberById.get(task.assignedMembershipId.toString()) : undefined;
    const event = task.eventId ? eventById.get(task.eventId.toString()) : undefined;
    return {
      id: task._id.toString(), title: task.title, description: task.description ?? "",
      assignedMembershipId: task.assignedMembershipId?.toString() ?? null,
      assignee: member ? { membershipId: member.membershipId, name: member.name, role: member.role } : null,
      eventId: task.eventId?.toString() ?? null,
      event: event ?? null,
      dueDate: task.dueDate?.toISOString() ?? null, priority: task.priority, status: task.status,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(),
    };
  });
}

async function validateAssociations(input: { assignedMembershipId?: string | null; eventId?: string | null }, weddingId: Types.ObjectId) {
  if (input.assignedMembershipId) {
    const member = await isWeddingMember(weddingId.toString(), input.assignedMembershipId);
    if (!member) throw new TaskServiceError("ASSIGNEE_INVALID", "Choose a current member of this wedding.");
  }
  if (input.eventId) {
    const event = await isActiveWeddingEvent(weddingId.toString(), input.eventId);
    if (!event) throw new TaskServiceError("EVENT_INVALID", "Choose an active event from this wedding.");
  }
}

export async function listWeddingTasks(userId: string, query: ListTasksQuery) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  const filter = buildWeddingTaskFilter(membership.weddingId.toString(), membership.id, query);

  const [items, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Task.countDocuments(filter),
  ]);
  return { data: await summaries(items as TaskRecord[], membership.weddingId), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function createWeddingTask(userId: string, input: CreateTaskInput) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  await validateAssociations(input, membership.weddingId);
  const [task] = await Task.create([{
    weddingId: membership.weddingId,
    title: input.title,
    description: input.description || undefined,
    assignedMembershipId: input.assignedMembershipId ? new Types.ObjectId(input.assignedMembershipId) : undefined,
    eventId: input.eventId ? new Types.ObjectId(input.eventId) : undefined,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    priority: input.priority,
    status: input.status,
    completedAt: input.status === "COMPLETED" ? new Date() : undefined,
  }]);
  return (await summaries([task.toObject() as TaskRecord], membership.weddingId))[0];
}

export async function getWeddingTask(userId: string, taskId: string) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  const task = await Task.findOne({ _id: new Types.ObjectId(taskId), weddingId: membership.weddingId }).lean();
  if (!task) throw new TaskServiceError("NOT_FOUND", "Task not found.");
  return (await summaries([task as TaskRecord], membership.weddingId))[0];
}

export async function updateWeddingTask(userId: string, taskId: string, input: UpdateTaskInput) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  const task = await Task.findOne({ _id: new Types.ObjectId(taskId), weddingId: membership.weddingId }).lean();
  if (!task) throw new TaskServiceError("NOT_FOUND", "Task not found.");
  await validateAssociations(input, membership.weddingId);

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const key of ["title", "priority", "status"] as const) if (input[key] !== undefined) set[key] = input[key];
  if (input.description !== undefined) {
    if (input.description) set.description = input.description;
    else unset.description = "";
  }
  if (input.assignedMembershipId !== undefined) {
    if (input.assignedMembershipId) set.assignedMembershipId = new Types.ObjectId(input.assignedMembershipId);
    else unset.assignedMembershipId = "";
  }
  if (input.eventId !== undefined) {
    if (input.eventId) set.eventId = new Types.ObjectId(input.eventId);
    else unset.eventId = "";
  }
  if (input.dueDate !== undefined) {
    if (input.dueDate) set.dueDate = new Date(input.dueDate);
    else unset.dueDate = "";
  }
  if (input.status === "COMPLETED" && task.status !== "COMPLETED") set.completedAt = new Date();
  if (input.status !== undefined && input.status !== "COMPLETED") unset.completedAt = "";

  const update: Record<string, unknown> = { $inc: { __v: 1 } };
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  const saved = await Task.findOneAndUpdate(
    { _id: task._id, weddingId: membership.weddingId, __v: task.__v },
    update,
    { returnDocument: "after", runValidators: true },
  ).lean();
  if (!saved) {
    if (!await Task.exists({ _id: task._id, weddingId: membership.weddingId })) throw new TaskServiceError("NOT_FOUND", "Task not found.");
    throw new TaskServiceError("CONFLICT", "This task changed while you were editing it. Reload and try again.");
  }
  return (await summaries([saved as TaskRecord], membership.weddingId))[0];
}

export async function deleteWeddingTask(userId: string, taskId: string) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  assertCanWrite(membership.role);
  const result = await Task.deleteOne({ _id: new Types.ObjectId(taskId), weddingId: membership.weddingId });
  if (!result.deletedCount) throw new TaskServiceError("NOT_FOUND", "Task not found.");
}

export async function getWeddingTaskSummary(userId: string, timeZone: string) {
  await connectToDatabase();
  const membership = await getMembership(userId);
  const [total, completed, upcoming] = await Promise.all([
    Task.countDocuments({ weddingId: membership.weddingId }),
    Task.countDocuments({ weddingId: membership.weddingId, status: "COMPLETED" }),
    Task.find({ weddingId: membership.weddingId, status: { $ne: "COMPLETED" }, dueDate: { $gte: localTodayStart(timeZone) } }).sort({ dueDate: 1, _id: 1 }).limit(5).lean(),
  ]);
  return { total, completed, upcoming: await summaries(upcoming as TaskRecord[], membership.weddingId), timeZone };
}
