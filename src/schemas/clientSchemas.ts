import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
  isActive: z.boolean().default(true),
  familyProfile: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
