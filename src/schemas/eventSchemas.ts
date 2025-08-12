import { z } from "zod";

export const eventSchema = z.object({
  type: z.string().min(1),
  value: z.number().positive(),
  frequency: z.enum(["ONCE", "MONTHLY", "ANNUAL"]),
  startDate: z.string().datetime(),
});

export type EventInput = z.infer<typeof eventSchema>;
