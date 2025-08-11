import prisma from "../prismaClient";
import { EventInput } from "../schemas/eventSchemas";

export async function createEvent(data: EventInput, clientId: number) {
  return prisma.event.create({
    data: {
      ...data,
      clientId,
    },
  });
}

export async function getEvents(clientId: number) {
  return prisma.event.findMany({ where: { clientId } });
}

export async function getEventById(id: number) {
  return prisma.event.findUnique({ where: { id } });
}

export async function updateEvent(id: number, data: Partial<EventInput>) {
  return prisma.event.update({ where: { id }, data });
}

export async function deleteEvent(id: number) {
  return prisma.event.delete({ where: { id } });
}
