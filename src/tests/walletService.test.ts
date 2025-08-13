import prisma from "../prismaClient";
import {
  createWallet,
  getWalletById,
  getWallets,
  updateWallet,
  deleteWallet,
} from "../services/walletService";
import type { Wallet, Prisma } from "@prisma/client";

const mockCreate = jest.fn<Promise<Wallet>, [Prisma.WalletCreateArgs]>();
const mockFindUnique = jest.fn<
  Promise<Wallet | null>,
  [Prisma.WalletFindUniqueArgs]
>();
const mockFindMany = jest.fn<Promise<Wallet[]>, [Prisma.WalletFindManyArgs]>();
const mockUpdate = jest.fn<Promise<Wallet>, [Prisma.WalletUpdateArgs]>();
const mockDelete = jest.fn<Promise<Wallet>, [Prisma.WalletDeleteArgs]>();

(prisma.wallet.create as unknown) = mockCreate;
(prisma.wallet.findUnique as unknown) = mockFindUnique;
(prisma.wallet.findMany as unknown) = mockFindMany;
(prisma.wallet.update as unknown) = mockUpdate;
(prisma.wallet.delete as unknown) = mockDelete;

describe("walletService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar uma carteira corretamente", async () => {
    const input = { assetClass: "Ações", percentage: 50, totalValue: 1000 };
    const clientId = 1;

    mockCreate.mockResolvedValue({ id: 1, clientId, ...input });

    const result = await createWallet(clientId, input);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...input, clientId } })
    );
    expect(result).toEqual({ id: 1, clientId, ...input });
  });

  it("deve retornar uma carteira pelo ID", async () => {
    const wallet: Wallet = {
      id: 1,
      clientId: 1,
      assetClass: "Ações",
      percentage: 50,
      totalValue: 1000,
    };

    mockFindUnique.mockResolvedValue(wallet);

    const result = await getWalletById(1);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(wallet);
  });

  it("deve retornar todas as carteiras de um cliente", async () => {
    const wallets: Wallet[] = [
      {
        id: 1,
        clientId: 1,
        assetClass: "Ações",
        percentage: 50,
        totalValue: 1000,
      },
      {
        id: 2,
        clientId: 1,
        assetClass: "Renda Fixa",
        percentage: 50,
        totalValue: 500,
      },
    ];

    mockFindMany.mockResolvedValue(wallets);

    const result = await getWallets(1);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { clientId: 1 } });
    expect(result).toEqual(wallets);
  });

  it("deve atualizar uma carteira corretamente", async () => {
    const updated: Wallet = {
      id: 1,
      clientId: 1,
      assetClass: "Ações",
      percentage: 60,
      totalValue: 1200,
    };

    mockUpdate.mockResolvedValue(updated);

    const result = await updateWallet(1, { percentage: 60, totalValue: 1200 });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { percentage: 60, totalValue: 1200 },
      })
    );
    expect(result).toEqual(updated);
  });

  it("deve deletar uma carteira corretamente", async () => {
    const wallet: Wallet = {
      id: 1,
      clientId: 1,
      assetClass: "Ações",
      percentage: 50,
      totalValue: 1000,
    };

    mockDelete.mockResolvedValue(wallet);

    const result = await deleteWallet(1);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(wallet);
  });
});
