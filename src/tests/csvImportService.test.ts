import { Readable } from "stream";
import prisma from "../prismaClient";
import {
  processCsvImport,
  registerSseClient,
} from "../services/csvImportService";
import type { Client, Prisma } from "@prisma/client";

const mockCreate = jest.fn<Promise<Client>, [Prisma.ClientCreateArgs]>();
(prisma.client.create as unknown) = mockCreate;

const mockClientWrite = jest.fn();
const mockStream = {
  write: mockClientWrite,
} as unknown as NodeJS.WritableStream;

describe("processCsvImport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve processar corretamente CSV válido e enviar progresso SSE", async () => {
    const csvData = `name,email,age,isActive,familyProfile
Cliente 1,c1@teste.com,25,true,perfil1
Cliente 2,c2@teste.com,30,false,perfil2
`;

    const fileStream = Readable.from([csvData]);
    const importId = "import-123";
    const advisorId = 1;

    registerSseClient(importId, mockStream);

    mockCreate.mockImplementation(async ({ data }) => ({
      id: Math.floor(Math.random() * 1000),
      advisorId,
      name: data.name,
      email: data.email,
      age: data.age,
      isActive: data.isActive ?? true,
      familyProfile: data.familyProfile ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await processCsvImport(fileStream, importId, advisorId);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Cliente 1",
          email: "c1@teste.com",
          age: 25,
          isActive: true,
          familyProfile: "perfil1",
        }),
      })
    );

    expect(mockClientWrite).toHaveBeenCalled();
    expect(mockClientWrite).toHaveBeenCalledWith(
      expect.stringContaining("Importação concluída")
    );
  });

  it("deve enviar mensagem de erro SSE para linha inválida", async () => {
    const csvData = `name,email,age,isActive,familyProfile
Cliente 1,c1@teste.com,INVALID_AGE,true,perfil1
`;

    const fileStream = Readable.from([csvData]);
    const importId = "import-456";
    const advisorId = 1;

    registerSseClient(importId, mockStream);

    await processCsvImport(fileStream, importId, advisorId);

    expect(mockCreate).not.toHaveBeenCalled();

    expect(mockClientWrite).toHaveBeenCalledWith(
      expect.stringContaining("Erro na linha 1: dados inválidos")
    );

    expect(mockClientWrite).toHaveBeenCalledWith(
      expect.stringContaining("Importação concluída")
    );
  });

  it("deve remover o client SSE do map após importação", async () => {
    const csvData = `name,email,age,isActive,familyProfile
Cliente 1,c1@teste.com,25,true,perfil1
`;

    const fileStream = Readable.from([csvData]);
    const importId = "import-789";
    const advisorId = 1;

    registerSseClient(importId, mockStream);

    await processCsvImport(fileStream, importId, advisorId);

    // @ts-expect-error: acessa o private Map apenas para teste
    expect(processCsvImport.sseClients?.has(importId)).toBeFalsy();
  });
});
