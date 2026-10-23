import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Enter a valid ID.");
const guestStatuses = ["PENDING", "ATTENDING", "NOT_ATTENDING"] as const;
const email = z.string().trim().max(254).email().or(z.literal(""));
const phone = z.string().trim().max(40).regex(/^[0-9+().\s-]*$/, "Enter a valid phone number.").or(z.literal(""));
const invitedEventIds = z.array(objectId).max(100).refine((ids) => new Set(ids).size === ids.length, "Events must be unique.");

export const createGuestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: email.optional(),
  phone: phone.optional(),
  maxGuests: z.number().int().min(1).max(10_000).default(1),
  invitedEventIds: invitedEventIds.default([]),
  notes: z.string().trim().max(2_000).optional(),
}).strict();

export const updateGuestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: email.optional(),
  phone: phone.optional(),
  maxGuests: z.number().int().min(1).max(10_000).optional(),
  invitedEventIds: invitedEventIds.optional(),
  notes: z.string().trim().max(2_000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one guest field to update.");

export const guestIdSchema = objectId;
export const listGuestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  rsvpStatus: z.enum(guestStatuses).optional(),
  eventId: objectId.optional(),
  invitationSent: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuerySchema>;
