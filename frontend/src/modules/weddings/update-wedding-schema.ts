import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid wedding date.");

export const updateWeddingSchema = z.object({
  brideName: z.string().trim().min(1).max(100).optional(),
  groomName: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  weddingDate: dateOnly.optional(),
  timeZone: z.string().trim().min(1).max(100).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone.").optional(),
  location: z.object({
    formattedAddress: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    googlePlaceId: z.string().trim().max(200).optional(),
  }).strict().optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one wedding detail to update.");

export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
