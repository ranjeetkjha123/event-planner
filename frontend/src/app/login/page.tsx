import { AuthScreen } from "@/components/foundation/auth-screens";
import { tokenSchema } from "@/modules/memberships/invitation-schema";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ inviteToken?: string | string[] }> }) {
  const { inviteToken } = await searchParams;
  const invitationToken = typeof inviteToken === "string" && tokenSchema.safeParse(inviteToken).success ? inviteToken : undefined;
  return <AuthScreen mode="login" invitationToken={invitationToken} />;
}
