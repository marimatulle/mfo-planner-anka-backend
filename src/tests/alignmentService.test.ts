import { calculateAlignment } from "../services/alignmentService";
import prisma from "../prismaClient";
import type { Wallet, Goal, Prisma } from "@prisma/client";

const mockFindFirst = jest.fn<
  Promise<Wallet | null>,
  [Prisma.WalletFindFirstArgs?]
>();
const mockFindMany = jest.fn<Promise<Goal[]>, [Prisma.GoalFindManyArgs?]>();

(prisma.wallet.findFirst as unknown) = mockFindFirst;
(prisma.goal.findMany as unknown) = mockFindMany;

describe("calculateAlignment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar null se a wallet não existir", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const result = await calculateAlignment(1);
    expect(result).toBeNull();
  });

  it("deve retornar null se não houver metas", async () => {
    const wallet: Wallet = {
      id: 1,
      clientId: 1,
      assetClass: "renda-fixa",
      percentage: 100,
      totalValue: 1000,
    };
    mockFindFirst.mockResolvedValue(wallet);
    mockFindMany.mockResolvedValue([]);

    const result = await calculateAlignment(1);
    expect(result).toBeNull();
  });

  type TestCase = {
    totalValue: number;
    goals: Pick<
      Goal,
      "id" | "clientId" | "type" | "targetValue" | "targetDate"
    >[];
    expectedAlignment: number;
    expectedCategory: string;
  };

  const testCases: TestCase[] = [
    {
      totalValue: 1000,
      goals: [
        {
          id: 1,
          clientId: 1,
          type: "investimento",
          targetValue: 950,
          targetDate: new Date(),
        },
      ],
      expectedAlignment: 95,
      expectedCategory: "verde",
    },
    {
      totalValue: 1000,
      goals: [
        {
          id: 2,
          clientId: 1,
          type: "investimento",
          targetValue: 800,
          targetDate: new Date(),
        },
      ],
      expectedAlignment: 80,
      expectedCategory: "amarelo-claro",
    },
    {
      totalValue: 1000,
      goals: [
        {
          id: 3,
          clientId: 1,
          type: "investimento",
          targetValue: 600,
          targetDate: new Date(),
        },
      ],
      expectedAlignment: 60,
      expectedCategory: "amarelo-escuro",
    },
    {
      totalValue: 1000,
      goals: [
        {
          id: 4,
          clientId: 1,
          type: "investimento",
          targetValue: 400,
          targetDate: new Date(),
        },
      ],
      expectedAlignment: 40,
      expectedCategory: "vermelho",
    },
  ];

  testCases.forEach(
    ({ totalValue, goals, expectedAlignment, expectedCategory }) => {
      it(`deve calcular corretamente o alinhamento com a categoria ${expectedCategory}`, async () => {
        const wallet: Wallet = {
          id: 1,
          clientId: 1,
          assetClass: "renda-fixa",
          percentage: 100,
          totalValue,
        };

        const goalList: Goal[] = goals.map((g) => ({ ...g }));

        mockFindFirst.mockResolvedValue(wallet);
        mockFindMany.mockResolvedValue(goalList);

        const result = await calculateAlignment(1);
        expect(result).toEqual({
          alignment: expectedAlignment,
          category: expectedCategory,
        });
      });
    }
  );
});
