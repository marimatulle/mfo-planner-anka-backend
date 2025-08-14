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
  const clientJsonSchema = {
    type: "object",
    required: ["name", "email", "phone"],
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      age: { type: "integer" },
    },
  };

  const clientPartialSchema = {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      age: { type: "integer" },
    },
  };

  app.post(
    "/clients",
    {
      preHandler: [app.authenticate],
      schema: {
        body: clientJsonSchema,
        response: {
          201: clientJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
          403: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode criar clientes" });

      const result = clientSchema.safeParse(request.body);
      if (!result.success)
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });

      try {
        const client = await clientService.createClient(result.data, user.id);
        return reply.code(201).send(client);
      } catch {
        return reply.code(500).send({ message: "Erro ao criar cliente" });
      }
    }
  );

  app.post(
    "/clients/import",
    {
      preHandler: [app.authenticate],
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              importId: { type: "string" },
            },
          },
          400: { type: "object", properties: { message: { type: "string" } } },
          403: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode importar clientes" });

      const filePart: MultipartFile | undefined = await (
        request as MultipartRequest
      ).file();
      if (!filePart)
        return reply.code(400).send({ message: "Arquivo CSV não enviado" });

      try {
        const importId = crypto.randomUUID();
        await processCsvImport(filePart.file, importId, user.id);
        return reply.send({ message: "Importação iniciada", importId });
      } catch {
        return reply
          .code(500)
          .send({ message: "Erro ao processar importação" });
      }
    }
  );

  app.get(
    "/clients/import-status/:importId",
    {
      schema: {
        params: {
          type: "object",
          required: ["importId"],
          properties: { importId: { type: "string" } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const { importId } = request.params as { importId: string };

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");

      registerSseClient(importId, reply.raw);

      request.raw.on("close", () => reply.raw.end());
    }
  );

  app.get(
    "/clients",
    {
      preHandler: [app.authenticate],
      schema: {
        response: {
          200: { type: "array", items: clientJsonSchema },
          403: { type: "object", properties: { message: { type: "string" } } },
          404: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode listar clientes" });

      try {
        const clients = await clientService.getClients(user.id);
        if (!clients.length)
          return reply.code(404).send({ message: "Nenhum cliente encontrado" });

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
      } catch {
        return reply.code(500).send({ message: "Erro ao listar clientes" });
      }
    }
  );

  app.get(
    "/clients/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: clientJsonSchema,
          403: { type: "object", properties: { message: { type: "string" } } },
          404: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode acessar clientes" });

      try {
        const client = await clientService.getClientById(Number(id));
        if (!client)
          return reply.code(404).send({ message: "Cliente não encontrado" });
        if (client.advisorId !== user.id)
          return reply
            .code(403)
            .send({ message: "Cliente não pertence ao ADVISOR" });

        const alignment = await calculateAlignment(client.id);
        return reply.send({
          ...client,
          alignment: alignment?.alignment ?? null,
          category: alignment?.category ?? null,
        });
      } catch {
        return reply.code(500).send({ message: "Erro ao obter cliente" });
      }
    }
  );

  app.put(
    "/clients/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: clientPartialSchema,
        response: {
          200: clientJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
          403: { type: "object", properties: { message: { type: "string" } } },
          404: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode atualizar clientes" });

      const result = clientSchema.partial().safeParse(request.body);
      if (!result.success)
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });

      try {
        const client = await clientService.getClientById(Number(id));
        if (!client)
          return reply.code(404).send({ message: "Cliente não encontrado" });
        if (client.advisorId !== user.id)
          return reply
            .code(403)
            .send({ message: "Cliente não pertence ao ADVISOR" });

        const updatedClient = await clientService.updateClient(
          Number(id),
          result.data
        );
        return reply.send(updatedClient);
      } catch {
        return reply.code(500).send({ message: "Erro ao atualizar cliente" });
      }
    }
  );

  app.delete(
    "/clients/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          204: { type: "null" },
          403: { type: "object", properties: { message: { type: "string" } } },
          404: { type: "object", properties: { message: { type: "string" } } },
          500: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Clients"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as JwtUser;
      if (user.role !== "ADVISOR")
        return reply
          .code(403)
          .send({ message: "Apenas ADVISOR pode deletar clientes" });

      try {
        const client = await clientService.getClientById(Number(id));
        if (!client)
          return reply.code(404).send({ message: "Cliente não encontrado" });
        if (client.advisorId !== user.id)
          return reply
            .code(403)
            .send({ message: "Cliente não pertence ao ADVISOR" });

        await clientService.deleteClient(Number(id));
        return reply.code(204).send();
      } catch {
        return reply.code(500).send({ message: "Erro ao deletar cliente" });
      }
    }
  );
}
