import { createTicketService } from "../../src/services/ticket.service";
import { ForbiddenError } from "../../src/utils/errors";
import { Ticket, TicketPriority, UserRole } from "@prisma/client";

// Mock de Prisma em memória focado em ownership: suporta filtro por reporterId
// no findMany/count e devolve os tickets criados pelo getById.
function makePrismaMock() {
  const tickets = new Map<string, Ticket>();

  // O service calcula dueAt a partir de ticket.category.slaHours, então o
  // findMany/findUnique do mock precisam devolver a relação category.
  const withCategory = (ticket: Ticket) => ({
    ...ticket,
    category: { id: ticket.categoryId, name: "Categoria", slaHours: 24 },
  });

  const applyWhere = (rows: Ticket[], where: any) => {
    let result = rows;
    if (where?.status) result = result.filter((t) => t.status === where.status);
    if (where?.reporterId) result = result.filter((t) => t.reporterId === where.reporterId);
    if (where?.assigneeId) result = result.filter((t) => t.assigneeId === where.assigneeId);
    return result;
  };

  return {
    ticket: {
      create: jest.fn(async ({ data }: any) => {
        const id = `ticket-${tickets.size + 1}`;
        const ticket: Ticket = {
          id,
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          priority: data.priority,
          reporterId: data.reporterId,
          assigneeId: data.assigneeId ?? null,
          categoryId: data.categoryId,
          locationId: data.locationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null,
          closedAt: null,
        };
        tickets.set(id, ticket);
        return ticket;
      }),
      findMany: jest.fn(async ({ where, skip, take }: any) => {
        const filtered = applyWhere(Array.from(tickets.values()), where);
        return filtered.slice(skip || 0, (skip || 0) + (take || 20)).map(withCategory);
      }),
      count: jest.fn(async ({ where }: any) =>
        applyWhere(Array.from(tickets.values()), where).length,
      ),
      findUnique: jest.fn(async ({ where }: any) => {
        const ticket = tickets.get(where.id);
        return ticket ? withCategory(ticket) : null;
      }),
    },
    location: { findUnique: jest.fn(async () => ({ id: "loc-1" })) },
    category: { findUnique: jest.fn(async () => ({ id: "cat-1", slaHours: 24 })) },
  };
}

const baseInput = {
  title: "Chamado",
  locationId: "loc-1",
  categoryId: "cat-1",
  priority: TicketPriority.MEDIUM,
};

describe("ticketService — ownership do REQUESTER", () => {
  describe("list", () => {
    it("REQUESTER recebe apenas os chamados que ele mesmo abriu", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      await service.create(baseInput, "ana");
      await service.create(baseInput, "ana");
      await service.create(baseInput, "bruno");

      const result = await service.list({}, {}, { userId: "ana", role: UserRole.REQUESTER });

      expect(result.total).toBe(2);
      expect(result.data.every((t) => t.reporterId === "ana")).toBe(true);
    });

    it("MANAGER enxerga o backlog inteiro (sem filtro de ownership)", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      await service.create(baseInput, "ana");
      await service.create(baseInput, "bruno");

      const result = await service.list({}, {}, { userId: "gestor", role: UserRole.MANAGER });

      expect(result.total).toBe(2);
    });

    it("sem viewer mantém o comportamento legado (lista tudo)", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      await service.create(baseInput, "ana");
      await service.create(baseInput, "bruno");

      const result = await service.list({}, {});

      expect(result.total).toBe(2);
    });
  });

  describe("getById", () => {
    it("REQUESTER acessa o próprio chamado", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      const created = await service.create(baseInput, "ana");

      const result = await service.getById(created.id, { userId: "ana", role: UserRole.REQUESTER });

      expect(result.id).toBe(created.id);
    });

    it("REQUESTER recebe ForbiddenError ao acessar chamado de outro", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      const created = await service.create(baseInput, "ana");

      await expect(
        service.getById(created.id, { userId: "bruno", role: UserRole.REQUESTER }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("OPERATOR acessa o chamado de qualquer solicitante", async () => {
      const prisma = makePrismaMock();
      const service = createTicketService(prisma as any);

      const created = await service.create(baseInput, "ana");

      const result = await service.getById(created.id, { userId: "op", role: UserRole.OPERATOR });

      expect(result.id).toBe(created.id);
    });
  });
});
