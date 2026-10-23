import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { taskIdSchema, updateTaskSchema } from "@/modules/tasks/task-schema";
import { deleteWeddingTask, getWeddingTask, TaskServiceError, updateWeddingTask } from "@/modules/tasks/task-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { readJsonBody } from "@/server/http/request-body";

type RouteContext = { params: Promise<{ taskId: string }> };
const privateHeaders = { "Cache-Control": "private, no-store" };

async function currentUser() {
  return getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}

function serviceError(error: unknown) {
  if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401, headers: privateHeaders });
  if (error instanceof TaskServiceError) {
    const status = error.code === "READ_ONLY" ? 403 : error.code === "NOT_FOUND" || error.code === "WORKSPACE_REQUIRED" ? 404 : error.code === "EVENT_INVALID" || error.code === "ASSIGNEE_INVALID" ? 400 : error.code === "CONFLICT" ? 409 : 500;
    if (status !== 500) return Response.json({ error: { code: error.code, message: error.message } }, { status, headers: privateHeaders });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to complete the task request." } }, { status: 500, headers: privateHeaders });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const current = await currentUser();
    const params = await context.params;
    const id = taskIdSchema.safeParse(params.taskId);
    if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task ID is invalid." } }, { status: 400, headers: privateHeaders });
    return Response.json({ data: await getWeddingTask(current.user.id, id.data) }, { headers: privateHeaders });
  } catch (error) { return serviceError(error); }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await currentUser(); }
  catch (error) { return serviceError(error); }
  const params = await context.params;
  const id = taskIdSchema.safeParse(params.taskId);
  if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task ID is invalid." } }, { status: 400, headers: privateHeaders });
  let body: unknown;
  try { body = await readJsonBody(request); }
  catch { return Response.json({ error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } }, { status: 400, headers: privateHeaders }); }
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task details are invalid.", details: parsed.error.flatten() } }, { status: 400, headers: privateHeaders });
  try { return Response.json({ data: await updateWeddingTask(current.user.id, id.data, parsed.data) }, { headers: privateHeaders }); }
  catch (error) { return serviceError(error); }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await currentUser(); }
  catch (error) { return serviceError(error); }
  const params = await context.params;
  const id = taskIdSchema.safeParse(params.taskId);
  if (!id.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task ID is invalid." } }, { status: 400, headers: privateHeaders });
  try {
    await deleteWeddingTask(current.user.id, id.data);
    return Response.json({ data: { success: true } }, { headers: privateHeaders });
  } catch (error) { return serviceError(error); }
}
