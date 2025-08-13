import { parse } from "csv-parse";
import { Readable } from "stream";
import prisma from "../prismaClient";
import { clientSchema } from "../schemas/clientSchemas";

type RawClientRow = {
  name: string;
  email: string;
  age: string;
  isActive?: string;
  familyProfile?: string;
};

const sseClients: Map<string, NodeJS.WritableStream> = new Map();

export function registerSseClient(
  importId: string,
  client: NodeJS.WritableStream
) {
  sseClients.set(importId, client);
}

const sendProgress = (importId: string, percent: number, message: string) => {
  const client = sseClients.get(importId);
  if (!client) return;

  const payload = `event: progress\ndata: ${JSON.stringify({
    percent,
    message,
  })}\n\n`;
  client.write(payload);
};

export async function processCsvImport(
  fileStream: Readable,
  importId: string,
  advisorId: number
) {
  const parser = fileStream.pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  const rows: RawClientRow[] = [];
  for await (const row of parser) {
    rows.push(row);
  }

  const total = rows.length;
  let processed = 0;

  await Promise.all(
    rows.map(async (rawRow, index) => {
      processed++;

      const transformed = {
        name: rawRow.name,
        email: rawRow.email,
        age: Number(rawRow.age),
        isActive: rawRow.isActive?.toLowerCase() === "true",
        familyProfile: rawRow.familyProfile?.trim() || "",
      };

      const result = clientSchema.safeParse(transformed);

      if (!result.success) {
        sendProgress(
          importId,
          Math.round((processed / total) * 100),
          `Erro na linha ${index + 1}: dados inválidos`
        );
        return;
      }

      await prisma.client.create({
        data: {
          ...result.data,
          advisor: { connect: { id: advisorId } },
        },
      });

      const percent = Math.round((processed / total) * 100);
      sendProgress(
        importId,
        percent,
        `Processando linha ${processed} de ${total}`
      );
    })
  );

  sendProgress(importId, 100, "Importação concluída.");
  sseClients.delete(importId);
}
