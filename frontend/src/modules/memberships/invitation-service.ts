import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import mongoose, { Types } from "mongoose";

import { getServerEnv } from "@/config/env";
import { User } from "@/modules/auth/models/user";
import { WeddingMemberInvitation } from "@/modules/weddings/models/member-invitation";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { Wedding } from "@/modules/weddings/models/wedding";
import { sendMemberInvitationEmail } from "@/server/email/resend";
import { connectToDatabase } from "@/server/database/connection";

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
function hashToken(token: string) { return createHmac("sha256", getServerEnv().AUTH_TOKEN_PEPPER).update(token).digest("hex"); }

export class MemberInvitationError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "MemberInvitationError"; }
}

export async function createMemberInvitation(input: { userId: string; weddingId: string; inviterId: string; email: string; role: "ADMIN" | "MANAGER"; origin: string }) {
  await connectToDatabase();
  const emailNormalized = input.email.trim().toLowerCase();
  const email = input.email.trim();
  const [existingUser, wedding, existingInvite] = await Promise.all([
    User.findOne({ emailNormalized }).select("_id").lean(),
    Wedding.findOne({ _id: new Types.ObjectId(input.weddingId) }).select("brideName groomName weddingDate").lean(),
    WeddingMemberInvitation.findOne({ weddingId: new Types.ObjectId(input.weddingId), emailNormalized, status: "PENDING", expiresAt: { $gt: new Date() } }).lean(),
  ]);
  const existingMembership = existingUser ? await WeddingMembership.findOne({ userId: existingUser._id }).lean() : null;
  if (!wedding) throw new MemberInvitationError("NOT_FOUND", "Wedding workspace not found.");
  if (existingMembership?.weddingId.toString() === input.weddingId) throw new MemberInvitationError("ALREADY_MEMBER", "This person is already a member of this wedding.");
  if (existingMembership) throw new MemberInvitationError("ALREADY_HAS_WEDDING", "This person already belongs to another wedding.");
  if (existingInvite) throw new MemberInvitationError("INVITATION_PENDING", "A pending invitation already exists for this email.");
  await WeddingMemberInvitation.updateMany({ weddingId: new Types.ObjectId(input.weddingId), emailNormalized, status: "PENDING", expiresAt: { $lte: new Date() } }, { $set: { status: "REVOKED" } });
  const token = randomBytes(32).toString("base64url");
  let invitation;
  try {
    [invitation] = await WeddingMemberInvitation.create([{
      weddingId: new Types.ObjectId(input.weddingId), email, emailNormalized, role: input.role,
      tokenHash: hashToken(token), status: "PENDING", invitedByUserId: new Types.ObjectId(input.inviterId),
      expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS),
    }]);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) throw new MemberInvitationError("INVITATION_PENDING", "A pending invitation already exists for this email.");
    throw error;
  }
  const inviteUrl = `${input.origin}/member-invitations/${token}`;
  try {
    await sendMemberInvitationEmail({ to: email, weddingName: `${wedding.brideName} & ${wedding.groomName}`, role: input.role, inviteUrl });
  } catch {
    await WeddingMemberInvitation.deleteOne({ _id: invitation._id });
    throw new MemberInvitationError("EMAIL_DELIVERY_FAILED", "The invitation could not be emailed. Check the Resend sender configuration and try again.");
  }
  return { id: invitation._id.toString(), email, role: input.role, status: "PENDING" as const, expiresAt: invitation.expiresAt.toISOString() };
}

export async function listWeddingMembers(weddingId: string) {
  await connectToDatabase();
  const memberships = await WeddingMembership.find({ weddingId: new Types.ObjectId(weddingId) }).lean();
  const users = await User.find({ _id: { $in: memberships.map((item) => item.userId) } }).select("name email").lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  return memberships.map((membership) => {
    const user = usersById.get(membership.userId.toString());
    return { membershipId: membership._id.toString(), user: { id: user?._id.toString() ?? "", name: user?.name ?? "Former member", email: user?.email ?? "" }, role: membership.role, joinedAt: membership.joinedAt.toISOString() };
  });
}

export async function listPendingInvitations(weddingId: string) {
  await connectToDatabase();
  return WeddingMemberInvitation.find({ weddingId: new Types.ObjectId(weddingId), status: "PENDING", expiresAt: { $gt: new Date() } }).select("email role status expiresAt createdAt").sort({ createdAt: -1 }).lean().then((items) => items.map((item) => ({ id: item._id.toString(), email: item.email, role: item.role, status: item.status, expiresAt: item.expiresAt.toISOString() })));
}

export async function revokeInvitation(weddingId: string, invitationId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(invitationId)) throw new MemberInvitationError("NOT_FOUND", "Invitation not found.");
  const result = await WeddingMemberInvitation.updateOne({ _id: new Types.ObjectId(invitationId), weddingId: new Types.ObjectId(weddingId), status: "PENDING" }, { $set: { status: "REVOKED" } });
  if (!result.modifiedCount) throw new MemberInvitationError("NOT_FOUND", "Invitation not found.");
}

export async function getPublicInvitation(token: string) {
  await connectToDatabase();
  const invitation = await WeddingMemberInvitation.findOne({ tokenHash: hashToken(token), status: "PENDING", expiresAt: { $gt: new Date() } }).lean();
  if (!invitation) throw new MemberInvitationError("INVALID_TOKEN", "This invitation is invalid, expired, or no longer available.");
  const wedding = await Wedding.findById(invitation.weddingId).select("brideName groomName weddingDate").lean();
  if (!wedding) throw new MemberInvitationError("INVALID_TOKEN", "This invitation is invalid, expired, or no longer available.");
  return { email: invitation.email, role: invitation.role, wedding: { brideName: wedding.brideName, groomName: wedding.groomName, weddingDate: wedding.weddingDate } };
}

export async function acceptInvitation(input: { token: string; userId: string; normalizedEmail: string }) {
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let role: "ADMIN" | "MANAGER" | undefined;
    await session.withTransaction(async () => {
      const invitation = await WeddingMemberInvitation.findOne({ tokenHash: hashToken(input.token) }).session(session);
      if (!invitation || invitation.status === "REVOKED") throw new MemberInvitationError("INVALID_TOKEN", "This invitation is invalid or no longer available.");
      if (invitation.status === "ACCEPTED") throw new MemberInvitationError("INVITATION_ALREADY_ACCEPTED", "This invitation has already been accepted.");
      if (invitation.expiresAt <= new Date()) throw new MemberInvitationError("TOKEN_EXPIRED", "This invitation has expired.");
      if (invitation.emailNormalized !== input.normalizedEmail) throw new MemberInvitationError("INVITATION_EMAIL_MISMATCH", "Sign in with the email address this invitation was sent to.");
      if (await WeddingMembership.findOne({ userId: new Types.ObjectId(input.userId) }).session(session)) throw new MemberInvitationError("ALREADY_HAS_WEDDING", "Your account already belongs to a wedding workspace.");
      await WeddingMembership.create([{ userId: new Types.ObjectId(input.userId), weddingId: invitation.weddingId, role: invitation.role, joinedAt: new Date() }], { session });
      invitation.status = "ACCEPTED";
      invitation.acceptedByUserId = new Types.ObjectId(input.userId);
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
      role = invitation.role;
    });
    return { role: role! };
  } catch (error) {
    if (error instanceof MemberInvitationError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) throw new MemberInvitationError("ALREADY_HAS_WEDDING", "Your account already belongs to a wedding workspace.");
    throw error;
  } finally { await session.endSession(); }
}
