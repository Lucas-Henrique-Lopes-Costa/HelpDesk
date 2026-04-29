import { createTicketService } from "../../src/services/ticket.service";
import { NotFoundError } from "../../src/utils/errors";
import { Ticket, TicketStatus, TicketPriority, Location, Category, User } from "@prisma/client";

type TicketRow = Ticket & {
  reporter: Pick<User, "id" | "name" | "email"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  category: Pick<Category, "id" | "name" | "slaHours"> | null;
  location: Pick<Location, "id" | "name" | "building" | "floor"> | null;
};

function makePrismaMock() {
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

  users.set("user-2", {
    id: "user-2",
    name: "Maria",
    email: "maria@test.com",
    passwordHash: "hash123",
    role: "OPERATOR",
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

  locations.set("loc-2", {
    id: "loc-2",
    name: "Sala 201",
    building: "Prédio B",
    floor: "2º Andar",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed de categorias
  categories.set("cat-1", {
    id: "cat-1",
    name: "Manutenção",
    slaHours: 24,
  });

  categories.set("cat-2", {
    id: "cat-2",
    name: "Limpeza",
    slaHours: 4,
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
          resolvedAt: data.resolvedAt ?? null,   
          closedAt: data.closedAt ?? null,       
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

      findMany: jest.fn(async ({ where, skip, take, include, orderBy }: any) => {
        let result = Array.from(tickets.values());

        // Aplicar filtros
        if (where?.status) result = result.filter((t) => t.status === where.status);
        if (where?.priority) result = result.filter((t) => t.priority === where.priority);
        if (where?.categoryId) result = result.filter((t) => t.categoryId === where.categoryId);
        if (where?.locationId) result = result.filter((t) => t.locationId === where.locationId);
        if (where?.assigneeId) result = result.filter((t) => t.assigneeId === where.assigneeId);

        // Ordenar por data de criação (decrescente)
        if (orderBy?.createdAt === "desc") {
          result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        // Paginação
        const paginated = result.slice(skip || 0, (skip || 0) + (take || 20));

        if (include) {
          return paginated.map((ticket) => ({
            ...ticket,
            reporter: users.get(ticket.reporterId),
            assignee: ticket.assigneeId ? users.get(ticket.assigneeId) : null,
            category: categories.get(ticket.categoryId),
            location: locations.get(ticket.locationId),
          }));
        }
        return paginated;
      }),

      count: jest.fn(async ({ where }: any) => {
        let result = Array.from(tickets.values());

        if (where?.status) result = result.filter((t) => t.status === where.status);
        if (where?.priority) result = result.filter((t) => t.priority === where.priority);
        if (where?.categoryId) result = result.filter((t) => t.categoryId === where.categoryId);
        if (where?.locationId) result = result.filter((t) => t.locationId === where.locationId);
        if (where?.assigneeId) result = result.filter((t) => t.assigneeId === where.assigneeId);

        return result.length;
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

describe("ticketService", () => {
  describe("list", () => {
    it("retorna tickets com paginação padrão (page=1, pageSize=20)", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      // Criar alguns tickets
      for (let i = 0; i < 5; i++) {
        await service.create(
          {
            title: `Ticket ${i + 1}`,
            description: `Descrição ${i + 1}`,
            locationId: "loc-1",
            categoryId: "cat-1",
            priority: TicketPriority.MEDIUM,
          },
          "user-1",
        );
      }

      const result = await service.list({}, {});

      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it("filtra por status", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket 1",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.HIGH,
        },
        "user-1",
      );

      const result = await service.list({ status: TicketStatus.OPEN }, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(TicketStatus.OPEN);
    });

    it("filtra por priority", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket 1",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.CRITICAL,
        },
        "user-1",
      );

      const result = await service.list({ priority: TicketPriority.CRITICAL }, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].priority).toBe(TicketPriority.CRITICAL);
    });

    it("filtra por categoryId", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket 1",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.create(
        {
          title: "Ticket 2",
          locationId: "loc-1",
          categoryId: "cat-2",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      const result = await service.list({ categoryId: "cat-1" }, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].categoryId).toBe("cat-1");
    });

    it("filtra por locationId", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket 1",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      await service.create(
        {
          title: "Ticket 2",
          locationId: "loc-2",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      const result = await service.list({ locationId: "loc-1" }, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].locationId).toBe("loc-1");
    });

    it("filtra por assigneeId", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket 1",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.MEDIUM,
        },
        "user-1",
      );

      // Simular atribuição de ticket (em um caso real, haveria um método assignTicket)
      const result = await service.list({ assigneeId: "user-2" }, {});

      expect(result.data).toHaveLength(0);
    });

    it("aplica paginação corretamente", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      // Criar 25 tickets
      for (let i = 0; i < 25; i++) {
        await service.create(
          {
            title: `Ticket ${i + 1}`,
            locationId: "loc-1",
            categoryId: "cat-1",
            priority: TicketPriority.MEDIUM,
          },
          "user-1",
        );
      }

      const page1 = await service.list({}, { page: 1, pageSize: 10 });
      expect(page1.data).toHaveLength(10);
      expect(page1.page).toBe(1);
      expect(page1.totalPages).toBe(3);

      const page2 = await service.list({}, { page: 2, pageSize: 10 });
      expect(page2.data).toHaveLength(10);
      expect(page2.page).toBe(2);

      const page3 = await service.list({}, { page: 3, pageSize: 10 });
      expect(page3.data).toHaveLength(5);
      expect(page3.page).toBe(3);
    });

    it("retorna tickets com dados completos incluindo relations", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await service.create(
        {
          title: "Ticket Test",
          description: "Descrição do teste",
          locationId: "loc-1",
          categoryId: "cat-1",
          priority: TicketPriority.HIGH,
        },
        "user-1",
      );

      const result = await service.list({}, {});

      expect(result.data[0]).toHaveProperty("title");
      expect(result.data[0].reporterId).toBe("user-1");
      expect(result.data[0].categoryId).toBe("cat-1");
      expect(result.data[0].locationId).toBe("loc-1");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("retorna ticket por ID com sucesso", async () => {
      const prismaMock = makePrismaMock();
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

      const result = await service.getById(created.id);

      expect(result.id).toBe(created.id);
      expect(result.title).toBe("Ticket Test");
      expect(result.status).toBe(TicketStatus.OPEN);
    });

    it("retorna ticket com relations populadas", async () => {
      const prismaMock = makePrismaMock();
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

      const result = await service.getById(created.id);

      expect(result).toHaveProperty("id");
      expect(result.reporterId).toBe("user-1");
      expect(result.categoryId).toBe("cat-1");
      expect(result.locationId).toBe("loc-1");
    });

    it("lança NotFoundError quando ticket não existe", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      await expect(service.getById("ticket-inexistente")).rejects.toThrow(NotFoundError);
    });

    it("retorna mensagem de erro apropriada", async () => {
      const prismaMock = makePrismaMock();
      const service = createTicketService(prismaMock as any);

      try {
        await service.getById("ticket-inexistente");
        fail("deveria ter lançado NotFoundError");
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundError);
        if (err instanceof NotFoundError) {
          expect(err.message).toBe("Ticket não encontrado");
        }
      }
    });
  });
});
