import { FastifyInstance } from "fastify";
import { eventSchema } from "../schemas/eventSchemas";
import * as eventService from "../services/eventService";

export async function eventRoutes(app: FastifyInstance) {
  app.post(
    "/clients/:id/events",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const result = eventSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const event = await eventService.createEvent(result.data, clientId);
      return reply.code(201).send(event);
    }
  );

  app.get(
    "/clients/:id/events",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const events = await eventService.getEvents(clientId);

      if (!events || events.length === 0) {
        return reply.code(404).send({ message: "Nenhuma evento encontrado" });
      }

      return reply.send(events);
    }
  );

  app.get(
    "/events/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const eventId = Number(id);

      const event = await eventService.getEventById(eventId);

      if (!event) {
        return reply.code(404).send({ message: "Evento não encontrada" });
      }

      return reply.send(event);
    }
  );

  app.put(
    "/events/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const eventId = Number(id);

      const result = eventSchema.partial().safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const updated = await eventService.updateEvent(eventId, result.data);
      return reply.send(updated);
    }
  );

  app.delete(
    "/events/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const eventId = Number(id);

      await eventService.deleteEvent(eventId);
      return reply.code(204).send();
    }
  );
}
