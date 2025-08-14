import { FastifyInstance } from "fastify";
import { walletSchema } from "../schemas/walletSchemas";
import * as walletService from "../services/walletService";

export async function walletRoutes(app: FastifyInstance) {
  const walletJsonSchema = {
    type: "object",
    required: ["name", "totalValue", "currency"],
    properties: {
      name: { type: "string", minLength: 1 },
      totalValue: { type: "number", minimum: 0 },
      currency: { type: "string", minLength: 1 },
    },
  };

  app.post(
    "/clients/:id/wallets",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: walletJsonSchema,
        response: {
          201: { type: "object", properties: { wallet: walletJsonSchema } },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["Wallets"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const result = walletSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const wallet = await walletService.createWallet(clientId, result.data);
      return reply.code(201).send({ wallet });
    }
  );

  app.get(
    "/clients/:id/wallets",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: { type: "array", items: walletJsonSchema },
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Wallets"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const wallets = await walletService.getWallets(clientId);
      if (!wallets || wallets.length === 0) {
        return reply.code(404).send({ message: "Nenhuma carteira encontrada" });
      }

      return reply.send(wallets);
    }
  );

  app.get(
    "/wallets/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: walletJsonSchema,
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Wallets"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const walletId = Number(id);

      const wallet = await walletService.getWalletById(walletId);
      if (!wallet) {
        return reply.code(404).send({ message: "Carteira não encontrada" });
      }

      return reply.send(wallet);
    }
  );

  app.put(
    "/wallets/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: { ...walletJsonSchema, required: [] },
        response: {
          200: walletJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["Wallets"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const walletId = Number(id);

      const result = walletSchema.partial().safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos para atualização",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const updated = await walletService.updateWallet(walletId, result.data);
      return reply.send(updated);
    }
  );

  app.delete(
    "/wallets/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: { 204: { type: "null" } },
        tags: ["Wallets"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const walletId = Number(id);

      await walletService.deleteWallet(walletId);
      return reply.code(204).send();
    }
  );
}
