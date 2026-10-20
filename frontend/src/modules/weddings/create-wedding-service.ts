import "server-only";

import { randomBytes } from "node:crypto";
import mongoose, { Types } from "mongoose";

import { connectToDatabase } from "@/server/database/connection";
import { WeddingMembership } from "@/modules/weddings/models/membership";
import { Wedding } from "@/modules/weddings/models/wedding";
import type { CreateWeddingInput } from "@/modules/weddings/create-wedding-schema";

export class WeddingAlreadyExistsError extends Error {
  constructor() {
    super("Your account already belongs to a wedding workspace.");
    this.name = "WeddingAlreadyExistsError";
  }
}

export function makeWeddingSlug(input: Pick<CreateWeddingInput, "brideName" | "groomName" | "weddingDate">) {
  const base = `${input.brideName}-${input.groomName}-${input.weddingDate}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  return base || `wedding-${input.weddingDate}`;
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function duplicateKeyFields(error: unknown) {
  if (!isDuplicateKey(error) || typeof error !== "object" || error === null || !("keyPattern" in error)) return [];
  const keyPattern = error.keyPattern;
  return typeof keyPattern === "object" && keyPattern !== null ? Object.keys(keyPattern) : [];
}

export async function createWedding(userId: string, input: CreateWeddingInput) {
  await connectToDatabase();
  const ownerId = new Types.ObjectId(userId);
  const title = input.title || `${input.brideName} & ${input.groomName}`;
  const baseSlug = makeWeddingSlug(input);

  for (let suffix = 1; suffix <= 5; suffix += 1) {
    const session = await mongoose.startSession();
    const slug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
    try {
      let created: { id: string; brideName: string; groomName: string; weddingDate: string; website: { slug: string } } | undefined;
      await session.withTransaction(async () => {
        const existingMembership = await WeddingMembership.findOne({ userId: ownerId }).session(session).lean();
        if (existingMembership) throw new WeddingAlreadyExistsError();

        const weddingId = new Types.ObjectId();
        await Wedding.create([{
          _id: weddingId,
          brideName: input.brideName,
          groomName: input.groomName,
          title,
          description: input.description ?? "",
          weddingDate: input.weddingDate,
          timeZone: input.timeZone,
          location: input.location,
          website: { slug },
          gallery: { token: randomBytes(32).toString("base64url"), isEnabled: false, guestUploadsEnabled: false },
          createdByUserId: ownerId,
        }], { session });
        await WeddingMembership.create([{
          userId: ownerId,
          weddingId,
          role: "ADMIN",
          joinedAt: new Date(),
        }], { session });
        created = {
          id: weddingId.toString(),
          brideName: input.brideName,
          groomName: input.groomName,
          weddingDate: input.weddingDate,
          website: { slug },
        };
      });
      if (!created) throw new Error("Wedding creation did not return a result.");
      return created;
    } catch (error) {
      if (error instanceof WeddingAlreadyExistsError) throw error;
      const duplicateFields = duplicateKeyFields(error);
      if (duplicateFields.includes("userId")) throw new WeddingAlreadyExistsError();
      if (duplicateFields.some((field) => field === "website.slug" || field === "gallery.token") && suffix < 5) continue;
      if (duplicateFields.length > 0) throw error;
      throw error;
    } finally {
      await session.endSession();
    }
  }
  throw new Error("Unable to allocate a wedding URL.");
}

export async function getWeddingForUser(userId: string) {
  await connectToDatabase();
  const membership = await WeddingMembership.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!membership) return null;
  const wedding = await Wedding.findOne({ _id: membership.weddingId }).lean();
  if (!wedding) return null;
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
    gallery: wedding.gallery,
    role: membership.role,
  };
}
