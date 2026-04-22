import { PrismaClient, Ticket, TicketPriority, TicketStatus } from "@prisma/client";
import { NotFoundError } from "../utils/errors";

export type CreateTicketInput = {
  title: string;
  description?: string;
  locationId: string;
  categoryId: string;
  priority: TicketPriority;
};

export type CreateTicketResponse = Ticket;

export type ListTicketsFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  locationId?: string;
  assigneeId?: string;
};

export type ListTicketsOptions = {
  page?: number;
  pageSize?: number;
};

export type TicketListResponse = {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TicketService = ReturnType<typeof createTicketService>;

export function createTicketService(prisma: PrismaClient) {
  return {
    async create(input: CreateTicketInput, reporterId: string): Promise<CreateTicketResponse> {
      // Verificar se location existe
      const location = await prisma.location.findUnique({
        where: { id: input.locationId },
      });
      if (!location) {
        throw new NotFoundError("Local não encontrado");
      }

      // Verificar se category existe
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }

      // Criar o ticket
      const ticket = await prisma.ticket.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: TicketStatus.OPEN,
          reporterId,
          categoryId: input.categoryId,
          locationId: input.locationId,
        },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          category: true,
          location: true,
        },
      });

      return ticket;
    },

    async list(
      filters: ListTicketsFilters = {},
      options: ListTicketsOptions = {},
    ): Promise<TicketListResponse> {
      const page = options.page ?? 1;
      const pageSize = options.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      // Construir filtros dinâmicos
      const where: any = {};
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.locationId) where.locationId = filters.locationId;
      if (filters.assigneeId) where.assigneeId = filters.assigneeId;

      const [data, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            reporter: {
              select: { id: true, name: true, email: true },
            },
            assignee: {
              select: { id: true, name: true, email: true },
            },
            category: {
              select: { id: true, name: true, slaHours: true },
            },
            location: {
              select: { id: true, name: true, building: true, floor: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.ticket.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    },

    async getById(id: string): Promise<Ticket> {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          category: {
            select: { id: true, name: true, slaHours: true },
          },
          location: {
            select: { id: true, name: true, building: true, floor: true },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      return ticket;
    },
  };
}