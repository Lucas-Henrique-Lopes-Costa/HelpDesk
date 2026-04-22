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
  };
}