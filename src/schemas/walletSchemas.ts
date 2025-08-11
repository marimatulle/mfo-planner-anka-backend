import { z } from "zod";

export const walletSchema = z.object({
  assetClass: z.string().min(1),
  percentage: z.number().min(0).max(100),
  totalValue: z.number().nonnegative(),
});

export type WalletInput = z.infer<typeof walletSchema>;
