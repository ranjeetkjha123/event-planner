import { cookies } from "next/headers";

import { getCurrentUser, UnauthenticatedError } from "@/modules/auth/current-user-service";
import { createTaskSchema, listTasksQuerySchema } from "@/modules/tasks/task-schema";
import { createWeddingTask, listWeddingTasks, TaskServiceError } from "@/modules/tasks/task-service";
import { isSameOriginRequest } from "@/server/auth/same-origin";
import { SESSION_COOKIE_NAME } from "@/server/auth/session-token";
import { readJsonBody } from "@/server/http/request-body";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value);
    const query = listTasksQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task filters are invalid.", details: query.error.flatten() } }, { status: 400, headers: privateHeaders });
    return Response.json(await listWeddingTasks(current.user.id, query.data), { headers: privateHeaders });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401, headers: privateHeaders });
    if (error instanceof TaskServiceError && error.code === "WORKSPACE_REQUIRED") return Response.json({ error: { code: error.code, message: error.message } }, { status: 404, headers: privateHeaders });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load tasks." } }, { status: 500, headers: privateHeaders });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: { code: "FORBIDDEN", message: "This request could not be verified." } }, { status: 403, headers: privateHeaders });
  let current;
  try { current = await getCurrentUser((await cookies()).get(SESSION_COOKIE_NAME)?.value); }
  catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: { code: "UNAUTHENTICATED", message: error.message } }, { status: 401, headers: privateHeaders });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create task." } }, { status: 500, headers: privateHeaders });
  }
  let body: unknown;
  try { body = await readJsonBody(request); }
  catch { return Response.json({ error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } }, { status: 400, headers: privateHeaders }); }
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: { code: "VALIDATION_ERROR", message: "Task details are invalid.", details: parsed.error.flatten() } }, { status: 400, headers: privateHeaders });
  try { return Response.json({ data: await createWeddingTask(current.user.id, parsed.data) }, { status: 201, headers: privateHeaders }); }
  catch (error) {
    if (error instanceof TaskServiceError) {
      const status = error.code === "READ_ONLY" ? 403 : error.code === "WORKSPACE_REQUIRED" ? 404 : error.code === "EVENT_INVALID" || error.code === "ASSIGNEE_INVALID" ? 400 : 500;
      if (status !== 500) return Response.json({ error: { code: error.code, message: error.message } }, { status, headers: privateHeaders });
    }
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create task." } }, { status: 500, headers: privateHeaders });
  }
}
