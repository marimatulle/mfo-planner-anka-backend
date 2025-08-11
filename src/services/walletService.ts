import prisma from "../prismaClient";
import { WalletInput } from "../schemas/walletSchemas";

export async function createWallet(clientId: number, data: WalletInput) {
  return prisma.wallet.create({
    data: { ...data, clientId },
  });
}

export async function getWalletById(id: number) {
  return prisma.wallet.findUnique({ where: { id } });
}

export async function getWallets(clientId: number) {
  return prisma.wallet.findMany({
    where: { clientId },
  });
}

export async function updateWallet(id: number, data: Partial<WalletInput>) {
  return prisma.wallet.update({
    where: { id },
    data,
  });
}

export async function deleteWallet(id: number) {
  return prisma.wallet.delete({ where: { id } });
}
