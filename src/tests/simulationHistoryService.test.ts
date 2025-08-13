import prisma from "../prismaClient";
import {
  createSimulation,
  getSimulations,
  getSimulationById,
} from "../services/simulationHistoryService";
import { simulateWealthCurve } from "../services/simulationService";
import type { Wallet, Event, Simulation, Prisma } from "@prisma/client";
import type { SimulationHistoryInput } from "../schemas/simulationHistorySchemas";

jest.mock("../services/simulationService");

// Mocks do Prisma
const mockFindFirstWallet = jest.fn<
  Promise<Wallet | null>,
  [Prisma.WalletFindFirstArgs?]
>();
const mockFindManyEvent = jest.fn<
  Promise<Event[]>,
  [Prisma.EventFindManyArgs?]
>();
const mockCreateSimulation = jest.fn<
  Promise<Simulation>,
  [Prisma.SimulationCreateArgs]
>();
const mockFindManySimulation = jest.fn<
  Promise<Simulation[]>,
  [Prisma.SimulationFindManyArgs?]
>();
const mockFindUniqueSimulation = jest.fn<
  Promise<Simulation | null>,
  [Prisma.SimulationFindUniqueArgs]
>();

(prisma.wallet.findFirst as unknown) = mockFindFirstWallet;
(prisma.event.findMany as unknown) = mockFindManyEvent;
(prisma.simulation.create as unknown) = mockCreateSimulation;
(prisma.simulation.findMany as unknown) = mockFindManySimulation;
(prisma.simulation.findUnique as unknown) = mockFindUniqueSimulation;

describe("simulationHistoryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (simulateWealthCurve as jest.Mock).mockReset();
  });

  it("deve criar uma simulação corretamente", async () => {
    const input: SimulationHistoryInput = { rate: 0.05 };
    const wallet: Wallet = {
      id: 1,
      clientId: 1,
      totalValue: 1000,
      assetClass: "TEST",
      percentage: 100,
    };
    const events: Event[] = [
      {
        id: 1,
        clientId: 1,
        type: "Investimento",
        value: 500,
        frequency: "ONCE",
        startDate: new Date(),
      },
    ];
    const curve = [{ year: 2025, projectedValue: 1050 }];

    mockFindFirstWallet.mockResolvedValue(wallet);
    mockFindManyEvent.mockResolvedValue(events);
    (simulateWealthCurve as jest.Mock).mockReturnValue(curve);

    const createdSimulation: Simulation = {
      id: 1,
      clientId: 1,
      data: { rate: 0.05, initialValue: 1000, curve },
      createdAt: new Date(),
    };

    mockCreateSimulation.mockResolvedValue(createdSimulation);

    const resultado = await createSimulation(1, input);

    expect(resultado).toEqual(createdSimulation);
    expect(mockFindFirstWallet).toHaveBeenCalledWith({
      where: { clientId: 1 },
    });
    expect(mockFindManyEvent).toHaveBeenCalledWith({ where: { clientId: 1 } });
    expect(simulateWealthCurve).toHaveBeenCalledWith(
      wallet.totalValue,
      events,
      input.rate
    );
    expect(mockCreateSimulation).toHaveBeenCalledWith({
      data: { clientId: 1, data: { rate: 0.05, initialValue: 1000, curve } },
    });
  });

  it("deve lançar erro se a carteira não existir", async () => {
    mockFindFirstWallet.mockResolvedValue(null);
    await expect(createSimulation(1, {})).rejects.toThrow(
      "Carteira não encontrada"
    );
  });

  it("deve retornar todas as simulações de um cliente", async () => {
    const simulations: Simulation[] = [
      {
        id: 1,
        clientId: 1,
        data: { rate: 0.04, initialValue: 1000, curve: [] },
        createdAt: new Date(),
      },
      {
        id: 2,
        clientId: 1,
        data: { rate: 0.05, initialValue: 1000, curve: [] },
        createdAt: new Date(),
      },
    ];

    mockFindManySimulation.mockResolvedValue(simulations);

    const resultado = await getSimulations(1);
    expect(resultado).toEqual(simulations);
    expect(mockFindManySimulation).toHaveBeenCalledWith({
      where: { clientId: 1 },
      orderBy: { createdAt: "desc" },
    });
  });

  it("deve retornar uma simulação pelo id", async () => {
    const simulation: Simulation = {
      id: 1,
      clientId: 1,
      data: { rate: 0.04, initialValue: 1000, curve: [] },
      createdAt: new Date(),
    };
    mockFindUniqueSimulation.mockResolvedValue(simulation);

    const resultado = await getSimulationById(1);
    expect(resultado).toEqual(simulation);
    expect(mockFindUniqueSimulation).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
