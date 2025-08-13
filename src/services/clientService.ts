import prisma from "../prismaClient";
import { ClientInput } from "../schemas/clientSchemas";

export async function createClient(data: ClientInput, advisorId: number) {
  return prisma.client.create({
    data: {
      ...data,
      advisorId,
    },
  });
}

export async function getClients(advisorId: number) {
  return prisma.client.findMany({
    where: { advisorId },
  });
}

export async function getClientById(id: number) {
  return prisma.client.findUnique({ where: { id } });
}

export async function updateClient(id: number, data: Partial<ClientInput>) {
  return prisma.client.update({ where: { id }, data });
}

export async function deleteClient(id: number) {
  return prisma.client.delete({ where: { id } });
}
