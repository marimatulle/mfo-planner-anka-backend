import prisma from "../prismaClient";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../services/eventService";
import type { Event, Prisma } from "@prisma/client";
import type { EventInput } from "../schemas/eventSchemas";

const mockCreate = jest.fn<Promise<Event>, [Prisma.EventCreateArgs]>();
const mockFindMany = jest.fn<Promise<Event[]>, [Prisma.EventFindManyArgs?]>();
const mockFindUnique = jest.fn<
  Promise<Event | null>,
  [Prisma.EventFindUniqueArgs]
>();
const mockUpdate = jest.fn<Promise<Event>, [Prisma.EventUpdateArgs]>();
const mockDelete = jest.fn<Promise<Event>, [Prisma.EventDeleteArgs]>();

(prisma.event.create as unknown) = mockCreate;
(prisma.event.findMany as unknown) = mockFindMany;
(prisma.event.findUnique as unknown) = mockFindUnique;
(prisma.event.update as unknown) = mockUpdate;
(prisma.event.delete as unknown) = mockDelete;

describe("eventService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar um evento corretamente", async () => {
    const input: EventInput = {
      type: "Consulta",
      value: 200,
      frequency: "ONCE",
      startDate: new Date().toISOString(),
    };

    const createdEvent: Event = {
      id: 1,
      clientId: 1,
      ...input,
      startDate: new Date(input.startDate),
    };

    mockCreate.mockResolvedValue(createdEvent);

    const resultado = await createEvent(input, 1);
    expect(resultado).toEqual(createdEvent);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...input, clientId: 1 },
    });
  });

  it("deve retornar todos os eventos de um cliente", async () => {
    const events: Event[] = [
      {
        id: 1,
        type: "Consulta",
        value: 200,
        frequency: "ONCE",
        startDate: new Date(),
        clientId: 1,
      },
      {
        id: 2,
        type: "Vacina",
        value: 100,
        frequency: "ONCE",
        startDate: new Date(),
        clientId: 1,
      },
    ];

    mockFindMany.mockResolvedValue(events);

    const resultado = await getEvents(1);
    expect(resultado).toEqual(events);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { clientId: 1 } });
  });

  it("deve retornar um evento pelo id", async () => {
    const event: Event = {
      id: 1,
      type: "Consulta",
      value: 200,
      frequency: "ONCE",
      startDate: new Date(),
      clientId: 1,
    };
    mockFindUnique.mockResolvedValue(event);

    const resultado = await getEventById(1);
    expect(resultado).toEqual(event);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("deve atualizar um evento corretamente", async () => {
    const updatedData: Partial<EventInput> = { value: 250 };
    const updatedEvent: Event = {
      id: 1,
      type: "Consulta",
      value: 250,
      frequency: "ONCE",
      startDate: new Date(),
      clientId: 1,
    };

    mockUpdate.mockResolvedValue(updatedEvent);

    const resultado = await updateEvent(1, updatedData);
    expect(resultado).toEqual(updatedEvent);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updatedData,
    });
  });

  it("deve deletar um evento corretamente", async () => {
    const deletedEvent: Event = {
      id: 1,
      type: "Consulta",
      value: 200,
      frequency: "ONCE",
      startDate: new Date(),
      clientId: 1,
    };

    mockDelete.mockResolvedValue(deletedEvent);

    const resultado = await deleteEvent(1);
    expect(resultado).toEqual(deletedEvent);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
