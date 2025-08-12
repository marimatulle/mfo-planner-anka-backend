import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyMultipart, { MultipartFile } from "@fastify/multipart";
import { randomUUID } from "crypto";
import {
  processCsvImport,
  registerSseClient,
} from "../services/csvImportService";

export async function csvImportRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart);

  app.get(
    "/import-status/:importId",
    async (request: FastifyRequest, reply) => {
      const { importId } = request.params as { importId: string };

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");

      registerSseClient(importId, reply.raw);

      request.raw.on("close", () => {
        reply.raw.end();
      });
    }
  );

  app.post(
    "/import-csv",
    async (request: FastifyRequest<{ Body: unknown }>, reply) => {
      const file: MultipartFile | undefined = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "Arquivo não enviado." });
      }

      const importId = randomUUID();
      processCsvImport(file.file, importId);

      return reply.send({ message: "Importação iniciada.", importId });
    }
  );
}
