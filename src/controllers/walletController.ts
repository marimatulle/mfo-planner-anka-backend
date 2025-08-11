import { FastifyInstance } from "fastify";
import { walletSchema } from "../schemas/walletSchemas";
import * as walletService from "../services/walletService";

export async function walletRoutes(app: FastifyInstance) {
  app.post(
    "/clients/:id/wallets",
    { preHandler: [app.authenticate] },
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
    { preHandler: [app.authenticate] },
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
    { preHandler: [app.authenticate] },
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
    { preHandler: [app.authenticate] },
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
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const walletId = Number(id);

      await walletService.deleteWallet(walletId);
      return reply.code(204).send();
    }
  );
}
