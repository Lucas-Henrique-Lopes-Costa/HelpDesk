import { PrismaClient, Ticket, TicketPriority, TicketStatus, Comment, Attachment } from "@prisma/client";
import { NotFoundError, UnprocessableEntityError } from "../utils/errors";
import { isValidTransition } from "../utils/ticket-transitions";

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

export type CreateCommentInput = {
  body: string;
};

export type CreateAttachmentInput = {
  url: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
};

export type AssignTicketInput = {
  assigneeId: string | null;
};

export type ListTicketsFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  locationId?: string;
  assigneeId?: string;
  slaBreached?: boolean;
};

export type ListTicketsOptions = {
  page?: number;
  pageSize?: number;
};

export type TicketListResponse = {
  data: (Ticket & {
    dueAt: string;
    slaBreached: boolean;
  })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TicketService = ReturnType<typeof createTicketService>;

/**
 * Calcula o tempo limite (dueAt) de um ticket baseado na categoria SLA
 * dueAt = createdAt + (category.slaHours * 60 * 60 * 1000)
 */
function calculateDueAt(createdAt: Date, slaHours: number): string {
  const dueDate = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
  return dueDate.toISOString();
}

/**
 * Verifica se um ticket ultrapassou o SLA
 */
function isSlaBreached(dueAt: string): boolean {
  return new Date() > new Date(dueAt);
}

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

      // Aplicar filtro slaBreached em memória após obter dados
      let filteredData = data.map((ticket: any) => {
        const dueAt = calculateDueAt(ticket.createdAt, ticket.category.slaHours);
        const slaBreached = isSlaBreached(dueAt);
        return {
          ...ticket,
          dueAt,
          slaBreached,
        };
      });

      let totalForPagination = total;
      if (filters.slaBreached !== undefined) {
        filteredData = filteredData.filter((t) => t.slaBreached === filters.slaBreached);
        totalForPagination = filteredData.length;
      }

      const totalPages = Math.ceil(totalForPagination / pageSize);

      return {
        data: filteredData,
        total: totalForPagination,
        page,
        pageSize,
        totalPages,
      };
    },

    async getById(id: string): Promise<Ticket & { dueAt: string; slaBreached: boolean }> {
      const ticket: any = await prisma.ticket.findUnique({
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

      const dueAt = calculateDueAt(ticket.createdAt, ticket.category.slaHours);
      const slaBreached = isSlaBreached(dueAt);

      return {
        ...ticket,
        dueAt,
        slaBreached,
      };
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

    // ===== COMENTÁRIOS =====
    async listComments(ticketId: string): Promise<(Comment & { author: { id: string; name: string; email: string } })[]> {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      return prisma.comment.findMany({
        where: { ticketId },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    },

    async createComment(ticketId: string, authorId: string, body: string): Promise<Comment & { author: { id: string; name: string; email: string } }> {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      return prisma.comment.create({
        data: {
          ticketId,
          authorId,
          body,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    },

    // ===== ANEXOS =====
    async listAttachments(ticketId: string): Promise<Attachment[]> {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      return prisma.attachment.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
      });
    },

    async createAttachment(ticketId: string, url: string, mimeType: string, sizeBytes: number, kind: string): Promise<Attachment> {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      return prisma.attachment.create({
        data: {
          ticketId,
          url,
          mimeType,
          sizeBytes,
          kind: kind as any,
        },
      });
    },

    // ===== ATRIBUIÇÃO =====
    async assignTicket(ticketId: string, assigneeId: string | null, userId: string, userRole: string): Promise<Ticket> {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          category: { select: { slaHours: true } },
        },
      });

      if (!ticket) {
        throw new NotFoundError("Ticket não encontrado");
      }

      // Verificar permissões e regras de negócio
      // Um OPERATOR pode assumir um chamado (passando seu próprio ID)
      // Um MANAGER pode atribuir a qualquer operador
      if (assigneeId && assigneeId !== userId && userRole !== "MANAGER") {
        throw new UnprocessableEntityError("Apenas gerentes podem atribuir chamados a outros operadores");
      }

      // Se o ticket está OPEN e está sendo assumido, mover para IN_PROGRESS
      let newStatus = ticket.status;
      if (ticket.status === TicketStatus.OPEN && assigneeId) {
        newStatus = TicketStatus.IN_PROGRESS;
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assigneeId: assigneeId || null,
          status: newStatus,
        },
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

      return updated;
    },

    // ===== ESTATÍSTICAS =====
    async getStats(): Promise<any> {
      const tickets = await prisma.ticket.findMany({
        include: {
          assignee: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slaHours: true } },
        },
      });

      // Contar por status
      const byStatus: Record<TicketStatus, number> = {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
        CANCELED: 0,
      };

      for (const ticket of tickets) {
        byStatus[ticket.status]++;
      }

      // Contar SLA breached
      let slaBreached = 0;
      for (const ticket of tickets) {
        const dueAt = calculateDueAt(ticket.createdAt, (ticket as any).category.slaHours);
        if (isSlaBreached(dueAt)) {
          slaBreached++;
        }
      }

      // Agrupar por responsável
      const byAssigneeMap = new Map<string | null, { name: string; count: number }>();
      for (const ticket of tickets) {
        const key = ticket.assigneeId || null;
        const name = ticket.assignee?.name || "Não atribuído";
        const current = byAssigneeMap.get(key) || { name, count: 0 };
        byAssigneeMap.set(key, { ...current, count: current.count + 1 });
      }

      const byAssignee = Array.from(byAssigneeMap.entries()).map(([assigneeId, data]) => ({
        assigneeId,
        assigneeName: data.name,
        count: data.count,
      }));

      // Agrupar por categoria
      const byCategoryMap = new Map<string, { name: string; count: number }>();
      for (const ticket of tickets) {
        const categoryId = ticket.categoryId;
        const categoryName = (ticket as any).category?.name || "Sem categoria";
        const current = byCategoryMap.get(categoryId) || { name: categoryName, count: 0 };
        byCategoryMap.set(categoryId, { ...current, count: current.count + 1 });
      }

      const byCategory = Array.from(byCategoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        count: data.count,
      }));

      return {
        byStatus,
        slaBreached,
        byAssignee,
        byCategory,
      };
    },
  };
}