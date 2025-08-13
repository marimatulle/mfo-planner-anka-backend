import { FastifyInstance, FastifyRequest } from "fastify";
import { MultipartFile, Multipart } from "@fastify/multipart";
import { Client } from "@prisma/client";
import * as clientService from "../services/clientService";
import { clientSchema } from "../schemas/clientSchemas";
import { calculateAlignment } from "../services/alignmentService";
import {
  processCsvImport,
  registerSseClient,
} from "../services/csvImportService";
import crypto from "crypto";

interface JwtUser {
  id: number;
  role: "ADVISOR" | "VIEWER";
}

type MultipartRequest = FastifyRequest & Multipart;

export async function clientRoutes(app: FastifyInstance) {
  app.post(
    "/clients",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtUser;

      if (user.role !== "ADVISOR") {
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode criar clientes" });
      }

      const result = clientSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const client = await clientService.createClient(result.data, user.id);
      return reply.code(201).send(client);
    }
  );

  app.post(
    "/clients/import",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtUser;

      if (user.role !== "ADVISOR") {
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode importar clientes" });
      }

      const filePart: MultipartFile | undefined = await (
        request as MultipartRequest
      ).file();
      if (!filePart) {
        return reply.code(400).send({ message: "Arquivo CSV não enviado" });
      }

      const importId = crypto.randomUUID();
      await processCsvImport(filePart.file, importId, user.id);

      return reply.send({ message: "Importação iniciada", importId });
    }
  );

  app.get("/clients/import-status/:importId", async (request, reply) => {
    const { importId } = request.params as { importId: string };

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    registerSseClient(importId, reply.raw);

    request.raw.on("close", () => {
      reply.raw.end();
    });
  });

  app.get(
    "/clients",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtUser;

      if (user.role !== "ADVISOR") {
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode listar seus clientes" });
      }

      const clients = await clientService.getClients(user.id);
      if (!clients.length) {
        return reply.code(404).send({ message: "Nenhum cliente encontrado" });
      }

      const enrichedClients = await Promise.all(
        clients.map(async (client: Client) => {
          const alignment = await calculateAlignment(client.id);
          return {
            ...client,
            alignment: alignment?.alignment ?? null,
            category: alignment?.category ?? null,
          };
        })
      );

      return reply.send(enrichedClients);
    }
  );

  app.get(
    "/clients/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;

      const client = await clientService.getClientById(Number(id));
      if (!client) {
        return reply.code(404).send({ message: "Cliente não encontrado" });
      }

      if (user.role === "ADVISOR" && client.advisorId !== user.id) {
        return reply
          .code(403)
          .send({ message: "Você não tem permissão para ver este cliente" });
      }

      const alignment = await calculateAlignment(client.id);
      return reply.send({
        ...client,
        alignment: alignment?.alignment ?? null,
        category: alignment?.category ?? null,
      });
    }
  );

  app.put(
    "/clients/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;

      const result = clientSchema.partial().safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const client = await clientService.getClientById(Number(id));
      if (!client) {
        return reply.code(404).send({ message: "Cliente não encontrado" });
      }

      if (client.advisorId !== user.id) {
        return reply
          .code(403)
          .send({ message: "Você não tem permissão para editar este cliente" });
      }

      const updatedClient = await clientService.updateClient(
        Number(id),
        result.data
      );
      return reply.send(updatedClient);
    }
  );

  app.delete(
    "/clients/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;

      const client = await clientService.getClientById(Number(id));
      if (!client) {
        return reply.code(404).send({ message: "Cliente não encontrado" });
      }

      if (client.advisorId !== user.id) {
        return reply.code(403).send({
          message: "Você não tem permissão para excluir este cliente",
        });
      }

      await clientService.deleteClient(Number(id));
      return reply.code(204).send();
    }
  );
}
