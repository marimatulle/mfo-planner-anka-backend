import prisma from "../prismaClient";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../services/clientService";
import type { Client, Prisma } from "@prisma/client";
import type { ClientInput } from "../schemas/clientSchemas";

const mockCreate = jest.fn<Promise<Client>, [Prisma.ClientCreateArgs]>();
const mockFindMany = jest.fn<Promise<Client[]>, [Prisma.ClientFindManyArgs?]>();
const mockFindUnique = jest.fn<
  Promise<Client | null>,
  [Prisma.ClientFindUniqueArgs]
>();
const mockUpdate = jest.fn<Promise<Client>, [Prisma.ClientUpdateArgs]>();
const mockDelete = jest.fn<Promise<Client>, [Prisma.ClientDeleteArgs]>();

(prisma.client.create as unknown) = mockCreate;
(prisma.client.findMany as unknown) = mockFindMany;
(prisma.client.findUnique as unknown) = mockFindUnique;
(prisma.client.update as unknown) = mockUpdate;
(prisma.client.delete as unknown) = mockDelete;

describe("clientService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar um cliente corretamente", async () => {
    const input: ClientInput = {
      name: "Cliente Teste",
      email: "teste@teste.com",
      age: 30,
      isActive: true,
      familyProfile: "",
    };

    const createdClient: Client = {
      id: 1,
      advisorId: 1,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCreate.mockResolvedValue(createdClient);

    const resultado = await createClient(input, 1);
    expect(resultado).toEqual(createdClient);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...input, advisorId: 1 },
    });
  });

  it("deve retornar todos os clientes de um advisor", async () => {
    const clients: Client[] = [
      {
        id: 1,
        advisorId: 1,
        name: "Cliente 1",
        email: "c1@teste.com",
        age: 25,
        isActive: true,
        familyProfile: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        advisorId: 1,
        name: "Cliente 2",
        email: "c2@teste.com",
        age: 28,
        isActive: true,
        familyProfile: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockFindMany.mockResolvedValue(clients);

    const resultado = await getClients(1);
    expect(resultado).toEqual(clients);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { advisorId: 1 } });
  });

  it("deve retornar um cliente pelo id", async () => {
    const client: Client = {
      id: 1,
      advisorId: 1,
      name: "Cliente 1",
      email: "c1@teste.com",
      age: 25,
      isActive: true,
      familyProfile: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindUnique.mockResolvedValue(client);

    const resultado = await getClientById(1);
    expect(resultado).toEqual(client);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("deve atualizar um cliente corretamente", async () => {
    const updatedData: Partial<ClientInput> = { familyProfile: "Nova família" };
    const updatedClient: Client = {
      id: 1,
      advisorId: 1,
      name: "Cliente 1",
      email: "c1@teste.com",
      age: 25,
      isActive: true,
      familyProfile: "Nova família",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUpdate.mockResolvedValue(updatedClient);

    const resultado = await updateClient(1, updatedData);
    expect(resultado).toEqual(updatedClient);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updatedData,
    });
  });

  it("deve deletar um cliente corretamente", async () => {
    const deletedClient: Client = {
      id: 1,
      advisorId: 1,
      name: "Cliente 1",
      email: "c1@teste.com",
      age: 25,
      isActive: true,
      familyProfile: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDelete.mockResolvedValue(deletedClient);

    const resultado = await deleteClient(1);
    expect(resultado).toEqual(deletedClient);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
