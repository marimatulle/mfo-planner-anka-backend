import { FastifyInstance } from "fastify";
import { clientSchema } from "../schemas/clientSchemas";
import * as clientService from "../services/clientService";

interface JwtUser {
  id: number;
  role: "ADVISOR" | "VIEWER";
}

export async function clientRoutes(app: FastifyInstance) {
  app.get("/clients", { preHandler: [app.authenticate] }, async (_, reply) => {
    const clients = await clientService.getAllClients();
    return reply.send(clients);
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
      return reply.send(clients);
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

      const data = result.data;

      const client = await clientService.getClientById(Number(id));
      if (!client) {
        return reply.code(404).send({ message: "Cliente não encontrado" });
      }

      if (client.advisorId !== user.id) {
        return reply
          .code(403)
          .send({ message: "Você não tem permissão para editar este cliente" });
      }

      const updatedClient = await clientService.updateClient(Number(id), data);
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
