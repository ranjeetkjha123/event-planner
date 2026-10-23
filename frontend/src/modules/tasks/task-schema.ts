import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Enter a valid ID.");
const isoDateTime = z.string().datetime({ offset: true });
export const taskStatuses = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

const taskFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  assignedMembershipId: objectId.nullable().optional(),
  eventId: objectId.nullable().optional(),
  dueDate: isoDateTime.nullable().optional(),
  priority: z.enum(taskPriorities),
  status: z.enum(taskStatuses),
};

export const createTaskSchema = z.object({
  ...taskFields,
  priority: taskFields.priority.optional().default("MEDIUM"),
  status: taskFields.status.optional().default("TODO"),
}).strict();

export const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description,
  assignedMembershipId: taskFields.assignedMembershipId,
  eventId: taskFields.eventId,
  dueDate: taskFields.dueDate,
  priority: taskFields.priority.optional(),
  status: taskFields.status.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one task field to update.");

export const taskIdSchema = objectId;
export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  eventId: z.union([objectId, z.literal("none")]).optional(),
  assignedMembershipId: z.union([objectId, z.literal("none")]).optional(),
  mine: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
