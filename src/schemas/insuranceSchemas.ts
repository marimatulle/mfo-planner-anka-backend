import { z } from "zod";

export const insuranceSchema = z.object({
  type: z.enum(["LIFE", "DISABILITY"]),
  coverageValue: z.number().positive(),
});

export type InsuranceInput = z.infer<typeof insuranceSchema>;
