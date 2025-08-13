import prisma from "../prismaClient";
import { generateClientSuggestions } from "../services/suggestionService";
import type { Goal, Wallet, Insurance, Event, Prisma } from "@prisma/client";

const mockFindManyGoal = jest.fn<Promise<Goal[]>, [Prisma.GoalFindManyArgs]>();
const mockFindManyWallet = jest.fn<
  Promise<Wallet[]>,
  [Prisma.WalletFindManyArgs]
>();
const mockFindManyInsurance = jest.fn<
  Promise<Insurance[]>,
  [Prisma.InsuranceFindManyArgs]
>();
const mockFindManyEvent = jest.fn<
  Promise<Event[]>,
  [Prisma.EventFindManyArgs]
>();

(prisma.goal.findMany as unknown) = mockFindManyGoal;
(prisma.wallet.findMany as unknown) = mockFindManyWallet;
(prisma.insurance.findMany as unknown) = mockFindManyInsurance;
(prisma.event.findMany as unknown) = mockFindManyEvent;

describe("suggestionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar mensagem quando não há metas", async () => {
    mockFindManyGoal.mockResolvedValue([]);
    const resultado = await generateClientSuggestions(1);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].message).toBe(
      "Nenhuma meta encontrada para este cliente."
    );
  });

  it("deve indicar meta já atingida quando current >= target", async () => {
    mockFindManyGoal.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "Aposentadoria",
        targetValue: 1000,
        targetDate: new Date(),
      },
    ]);
    mockFindManyWallet.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        totalValue: 1200,
        assetClass: "TEST",
        percentage: 100,
      },
    ]);
    mockFindManyInsurance.mockResolvedValue([]);
    mockFindManyEvent.mockResolvedValue([]);

    const resultado = await generateClientSuggestions(1);

    expect(resultado[0].message).toBe('Meta "Aposentadoria" já foi atingida.');
    expect(resultado[0].monthlySuggestion).toBeUndefined();
  });

  it("deve calcular sugestão mensal corretamente para meta a atingir", async () => {
    mockFindManyGoal.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "Aposentadoria",
        targetValue: 5000,
        targetDate: new Date(),
      },
    ]);
    mockFindManyWallet.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        totalValue: 1000,
        assetClass: "TEST",
        percentage: 100,
      },
    ]);
    mockFindManyInsurance.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "LIFE",
        coverageValue: 500,
        createdAt: new Date(),
      },
    ]);
    mockFindManyEvent.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "Investimento",
        value: 100,
        frequency: "MONTHLY",
        startDate: new Date(),
      },
    ]);

    const resultado = await generateClientSuggestions(1, 12);

    expect(resultado[0].monthlySuggestion).toBeDefined();
    expect(resultado[0].message).toContain("invista R$");
  });

  it("deve considerar eventos ANNUAL convertidos para valor mensal", async () => {
    mockFindManyGoal.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "Meta Anual",
        targetValue: 5000,
        targetDate: new Date(),
      },
    ]);
    mockFindManyWallet.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        totalValue: 1000,
        assetClass: "TEST",
        percentage: 100,
      },
    ]);
    mockFindManyInsurance.mockResolvedValue([]);
    mockFindManyEvent.mockResolvedValue([
      {
        id: 1,
        clientId: 1,
        type: "Bônus",
        value: 1200,
        frequency: "ANNUAL",
        startDate: new Date(),
      },
    ]);

    const resultado = await generateClientSuggestions(1, 12);

    const totalCurrent = 1000;
    const monthlyImpact = 1200 / 12;
    const gap = 5000 - totalCurrent;

    expect(resultado[0].monthlySuggestion).toBe(
      Math.ceil((gap - monthlyImpact * 12) / 12)
    );
  });
});
