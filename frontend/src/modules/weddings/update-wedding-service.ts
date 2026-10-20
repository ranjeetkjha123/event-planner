import "server-only";

import { Types } from "mongoose";

import { WeddingMembership } from "@/modules/weddings/models/membership";
import { Wedding } from "@/modules/weddings/models/wedding";
import type { UpdateWeddingInput } from "@/modules/weddings/update-wedding-schema";
import { connectToDatabase } from "@/server/database/connection";

export class WeddingNotFoundError extends Error {
  constructor() {
    super("Wedding workspace not found.");
    this.name = "WeddingNotFoundError";
  }
}

export async function updateWeddingForUser(userId: string, input: UpdateWeddingInput) {
  if (!Types.ObjectId.isValid(userId)) throw new WeddingNotFoundError();
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) throw new WeddingNotFoundError();

  const updates: Record<string, unknown> = { ...input };
  if (input.location) {
    const current = await Wedding.findOne({ _id: membership.weddingId }).select("location").lean();
    if (!current) throw new WeddingNotFoundError();
    updates.location = { ...current.location, ...input.location };
  }
  if (input.brideName !== undefined || input.groomName !== undefined || input.title?.trim() === "") {
    const current = await Wedding.findOne({ _id: membership.weddingId }).select("title brideName groomName").lean();
    if (!current) throw new WeddingNotFoundError();
    const oldDefaultTitle = `${current.brideName} & ${current.groomName}`;
    const brideName = input.brideName ?? current.brideName;
    const groomName = input.groomName ?? current.groomName;
    if (input.title?.trim() === "") {
      updates.title = `${brideName} & ${groomName}`;
    } else if (current.title === oldDefaultTitle && (input.title === undefined || input.title === oldDefaultTitle)) {
      updates.title = `${brideName} & ${groomName}`;
    }
  }

  const wedding = await Wedding.findOneAndUpdate(
    { _id: membership.weddingId },
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();
  if (!wedding) throw new WeddingNotFoundError();

  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    title: wedding.title,
    description: wedding.description,
    weddingDate: wedding.weddingDate,
    timeZone: wedding.timeZone,
    location: wedding.location,
    website: wedding.website,
    role: membership.role,
  };
}
