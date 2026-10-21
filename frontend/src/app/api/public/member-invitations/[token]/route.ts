import { getPublicInvitation, MemberInvitationError } from "@/modules/memberships/invitation-service";
import { tokenSchema } from "@/modules/memberships/invitation-schema";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!tokenSchema.safeParse(token).success) return Response.json({ error: { code: "INVALID_TOKEN", message: "This invitation is invalid, expired, or no longer available." } }, { status: 404, headers: { "Cache-Control": "no-store" } });
  try { return Response.json({ data: await getPublicInvitation(token) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    if (error instanceof MemberInvitationError) return Response.json({ error: { code: error.code, message: error.message } }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load invitation." } }, { status: 500 });
  }
}
