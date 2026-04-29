import { createTicketService } from "../../src/services/ticket.service";
import { UnprocessableEntityError, NotFoundError } from "../../src/utils/errors";
import { Ticket, TicketStatus, TicketPriority, Location, Category, User } from "@prisma/client";
import { isValidTransition, getValidNextStatuses } from "../../src/utils/ticket-transitions";

function makePrismaMockWithUpdate() {
  const tickets = new Map<string, Ticket>();
  const locations = new Map<string, Location>();
  const categories = new Map<string, Category>();
  const users = new Map<string, User>();

  // Seed de usuários
  users.set("user-1", {
    id: "user-1",
    name: "João",
    email: "joao@test.com",
    passwordHash: "hash123",
    role: "REQUESTER",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed de locais
  locations.set("loc-1", {
    id: "loc-1",
    name: "Sala 101",
    building: "Prédio A",
    floor: "1º Andar",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed de categorias
  categories.set("cat-1", {
    id: "cat-1",
    name: "Manutenção",
    slaHours: 24,
  });

  return {
    store: { tickets, locations, categories, users },
    ticket: {
      create: jest.fn(async ({ data, include }: any) => {
        const id = `ticket-${tickets.size + 1}`;
        const ticket: Ticket = {
          id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          reporterId: data.reporterId,
          assigneeId: data.assigneeId,
          categoryId: data.categoryId,
          locationId: data.locationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null,
          closedAt: null,
        };
        tickets.set(id, ticket);

        if (include) {
          return {
            ...ticket,
            reporter: users.get(data.reporterId),
            assignee: data.assigneeId ? users.get(data.assigneeId) : null,
            category: categories.get(data.categoryId),
            location: locations.get(data.locationId),
          };
        }
        return ticket;
      }),

      findUnique: jest.fn(async ({ where, include }: any) => {
        const ticket = tickets.get(where.id);
        if (!ticket) return null;

        if (include) {
          return {
            ...ticket,
            reporter: users.get(ticket.reporterId),
            assignee: ticket.assigneeId ? users.get(ticket.assigneeId) : null,
            category: categories.get(ticket.categoryId),
            location: locations.get(ticket.locationId),
          };
        }
        return ticket;
      }),

      update: jest.fn(async ({ where, data, include }: any) => {
        const ticket = tickets.get(where.id);
        if (!ticket) return null;

        const updated: Ticket = {
          ...ticket,
          ...data,
          updatedAt: new Date(),
        };
        tickets.set(where.id, updated);

        if (include) {
          return {
            ...updated,
            reporter: users.get(updated.reporterId),
            assignee: updated.assigneeId ? users.get(updated.assigneeId) : null,
            category: categories.get(updated.categoryId),
            location: locations.get(updated.locationId),
          };
        }
        return updated;
      }),
    },

    location: {
      findUnique: jest.fn(async ({ where }: any) => {
        return locations.get(where.id) || null;
      }),
    },

    category: {
      findUnique: jest.fn(async ({ where }: any) => {
        return categories.get(where.id) || null;
      }),
    },
  };
}

describe("Ticket Status Transitions", () => {
  describe("isValidTransition", () => {
    it("deve permitir transição OPEN → IN_PROGRESS", () => {
      expect(isValidTransition(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)).toBe(true);
    });

    it("deve permitir transição OPEN → CANCELED", () => {
      expect(isValidTransition(TicketStatus.OPEN, TicketStatus.CANCELED)).toBe(true);
    });

    it("deve permitir transição IN_PROGRESS → RESOLVED", () => {
      expect(isValidTransition(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED)).toBe(true);
    });

    it("deve permitir transição IN_PROGRESS → CANCELED", () => {
      expect(isValidTransition(TicketStatus.IN_PROGRESS, TicketStatus.CANCELED)).toBe(true);
    });

    it("deve permitir transição RESOLVED → CLOSED", () => {
      expect(isValidTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED)).toBe(true);
    });

    it("não deve permitir transição OPEN → RESOLVED", () => {
      expect(isValidTransition(TicketStatus.OPEN, TicketStatus.RESOLVED)).toBe(false);
    });

    it("não deve permitir transição OPEN → CLOSED", () => {
      expect(isValidTransition(TicketStatus.OPEN, TicketStatus.CLOSED)).toBe(false);
    });

    it("não deve permitir transição IN_PROGRESS → OPEN", () => {
      expect(isValidTransition(TicketStatus.IN_PROGRESS, TicketStatus.OPEN)).toBe(false);
    });

    it("não deve permitir transição RESOLVED → OPEN", () => {
      expect(isValidTransition(TicketStatus.RESOLVED, TicketStatus.OPEN)).toBe(false);
    });

    it("não deve permitir transição CLOSED → OPEN", () => {
      expect(isValidTransition(TicketStatus.CLOSED, TicketStatus.OPEN)).toBe(false);
    });

    it("não deve permitir transição CANCELED → qualquer outro status", () => {
      expect(isValidTransition(TicketStatus.CANCELED, TicketStatus.OPEN)).toBe(false);
      expect(isValidTransition(TicketStatus.CANCELED, TicketStatus.IN_PROGRESS)).toBe(false);
      expect(isValidTransition(TicketStatus.CANCELED, TicketStatus.RESOLVED)).toBe(false);
      expect(isValidTransition(TicketStatus.CANCELED, TicketStatus.CLOSED)).toBe(false);
    });

    it("não deve permitir transição para o mesmo status", () => {
      expect(isValidTransition(TicketStatus.OPEN, TicketStatus.OPEN)).toBe(false);
      expect(isValidTransition(TicketStatus.IN_PROGRESS, TicketStatus.IN_PROGRESS)).toBe(false);
    });
  });

  describe("getValidNextStatuses", () => {
    it("retorna [IN_PROGRESS, CANCELED] para OPEN", () => {
      const result = getValidNextStatuses(TicketStatus.OPEN);
      expect(result).toEqual([TicketStatus.IN_PROGRESS, TicketStatus.CANCELED]);
    });

    it("retorna [RESOLVED, CANCELED] para IN_PROGRESS", () => {
      const result = getValidNextStatuses(TicketStatus.IN_PROGRESS);
      expect(result).toEqual([TicketStatus.RESOLVED, TicketStatus.CANCELED]);
    });

    it("retorna [CLOSED] para RESOLVED", () => {
      const result = getValidNextStatuses(TicketStatus.RESOLVED);
      expect(result).toEqual([TicketStatus.CLOSED]);
    });

    it("retorna [] para CLOSED", () => {
      const result = getValidNextStatuses(TicketStatus.CLOSED);
      expect(result).toEqual([]);
    });

    it("retorna [] para CANCELED", () => {
      const result = getValidNextStatuses(TicketStatus.CANCELED);
      expect(result).toEqual([]);
    });
  });

  describe("ticketService.updateStatus", () => {
    it("deve atualizar status válido de OPEN para IN_PROGRESS", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      const updated = await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });

      expect(updated.status).toBe(TicketStatus.IN_PROGRESS);
      expect(updated.resolvedAt).toBeNull();
      expect(updated.closedAt).toBeNull();
    });

    it("deve atualizar status válido de IN_PROGRESS para RESOLVED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      const updated = await service.updateStatus(created.id, { status: TicketStatus.RESOLVED });

      expect(updated.status).toBe(TicketStatus.RESOLVED);
      expect(updated.resolvedAt).not.toBeNull();
      expect(updated.closedAt).toBeNull();
    });

    it("deve atualizar status válido de RESOLVED para CLOSED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      await service.updateStatus(created.id, { status: TicketStatus.RESOLVED });
      const updated = await service.updateStatus(created.id, { status: TicketStatus.CLOSED });

      expect(updated.status).toBe(TicketStatus.CLOSED);
      expect(updated.resolvedAt).not.toBeNull();
      expect(updated.closedAt).not.toBeNull();
    });

    it("deve rejeitar transição inválida de OPEN para RESOLVED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await expect(
        service.updateStatus(created.id, { status: TicketStatus.RESOLVED }),
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it("deve rejeitar transição inválida de OPEN para CLOSED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await expect(
        service.updateStatus(created.id, { status: TicketStatus.CLOSED }),
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it("deve rejeitar transição inválida de RESOLVED para OPEN", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      await service.updateStatus(created.id, { status: TicketStatus.RESOLVED });

      await expect(
        service.updateStatus(created.id, { status: TicketStatus.OPEN }),
      ).rejects.toThrow(UnprocessableEntityError);
    });

    it("deve rejeitar atualização de ticket inexistente", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      await expect(
        service.updateStatus("ticket-inexistente", { status: TicketStatus.IN_PROGRESS }),
      ).rejects.toThrow(NotFoundError);
    });

    it("deve permitir transição OPEN para CANCELED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      const updated = await service.updateStatus(created.id, { status: TicketStatus.CANCELED });

      expect(updated.status).toBe(TicketStatus.CANCELED);
    });

    it("deve permitir transição IN_PROGRESS para CANCELED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      const updated = await service.updateStatus(created.id, { status: TicketStatus.CANCELED });

      expect(updated.status).toBe(TicketStatus.CANCELED);
    });

    it("deve preencher resolvedAt automaticamente ao transicionar para RESOLVED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      const updated = await service.updateStatus(created.id, { status: TicketStatus.RESOLVED });

      expect(updated.resolvedAt).toBeInstanceOf(Date);
      expect(updated.resolvedAt!.getTime()).toBeGreaterThan(0);
    });

    it("deve preencher closedAt automaticamente ao transicionar para CLOSED", async () => {
      const prismaMock = makePrismaMockWithUpdate();
      const service = createTicketService(prismaMock as any);

      const created = await service.create(
        {
          title: "Ticket Test",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.updateStatus(created.id, { status: TicketStatus.IN_PROGRESS });
      await service.updateStatus(created.id, { status: TicketStatus.RESOLVED });
      const updated = await service.updateStatus(created.id, { status: TicketStatus.CLOSED });

      expect(updated.closedAt).toBeInstanceOf(Date);
      expect(updated.closedAt!.getTime()).toBeGreaterThan(0);
    });
  });
});
