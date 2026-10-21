import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });
const eventTypes = ["ROKA", "ENGAGEMENT", "MEHENDI", "HALDI", "SANGEET", "COCKTAIL", "WEDDING", "RECEPTION", "CUSTOM"] as const;

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(eventTypes).optional(),
  startsAt: isoDateTime,
  endsAt: isoDateTime.optional(),
  venueName: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  dressCode: z.string().trim().max(120).optional(),
}).strict().refine((event) => !event.endsAt || Date.parse(event.endsAt) > Date.parse(event.startsAt), { message: "End time must be after start time.", path: ["endsAt"] });

export const eventDateTimeInputSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), timeZone: z.string().min(1).max(100) });
export type CreateEventInput = z.infer<typeof createEventSchema>;
