import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid wedding date.");

export const createWeddingSchema = z.object({
  brideName: z.string().trim().min(1).max(100),
  groomName: z.string().trim().min(1).max(100),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  weddingDate: dateOnly,
  timeZone: z.string().trim().min(1).max(100).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone."),
  location: z.object({
    formattedAddress: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    googlePlaceId: z.string().trim().max(200).optional(),
  }).strict(),
}).strict();

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;
