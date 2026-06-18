import { PrismaClient, Ticket, TicketPriority, TicketStatus, UserRole } from "@prisma/client";
import { ForbiddenError, NotFoundError, UnprocessableEntityError } from "../utils/errors";
import { isValidTransition } from "../utils/ticket-transitions";

// Quem está consultando — usado para aplicar ownership (REQUESTER só enxerga os próprios chamados).
export type TicketViewer = {
  userId: string;
  role: UserRole;
};

export type CreateTicketInput = {
  title: string;
  description?: string;
  locationId: string;
  categoryId: string;
  priority: TicketPriority;
};

export type CreateTicketResponse = Ticket;

export type UpdateStatusInput = {
  status: TicketStatus;
};

export type UpdateStatusResponse = Ticket;

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
      viewer?: TicketViewer,
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

      // Ownership: solicitante só enxerga os chamados que ele mesmo abriu.
      if (viewer && viewer.role === UserRole.REQUESTER) {
        where.reporterId = viewer.userId;
      }

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

    async getById(id: string, viewer?: TicketViewer): Promise<Ticket> {
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

      // Ownership: solicitante só pode abrir os próprios chamados.
      if (viewer && viewer.role === UserRole.REQUESTER && ticket.reporterId !== viewer.userId) {
        throw new ForbiddenError("Você não tem acesso a este chamado");
      }

      return ticket;
    },

    async updateStatus(ticketId: string, input: UpdateStatusInput): Promise<UpdateStatusResponse> {
      // Buscar o ticket atual
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      // Validar transição de status
      if (!isValidTransition(ticket.status, input.status)) {
        throw new UnprocessableEntityError(
          `Transição inválida de ${ticket.status} para ${input.status}`,
        );
      }

      // Preparar dados para atualizar
      const updateData: any = {
        status: input.status,
      };

      // Preencher timestamps automaticamente
      if (input.status === TicketStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }
      if (input.status === TicketStatus.CLOSED) {
        updateData.closedAt = new Date();
      }

      // Atualizar o ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
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

      return updatedTicket;
    },
  };
}