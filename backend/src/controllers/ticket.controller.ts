import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TicketPriority } from "@prisma/client";
import { TicketService } from "../services/ticket.service";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  locationId: z.string().uuid("ID do local deve ser um UUID válido"),
  categoryId: z.string().uuid("ID da categoria deve ser um UUID válido"),
  priority: z.nativeEnum(TicketPriority, { errorMap: () => ({ message: "Prioridade deve ser LOW, MEDIUM, HIGH ou CRITICAL" }) }),
});

export function createTicketController(ticketService: TicketService) {
  return {
    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const input = req.body;
        const reporterId = req.user.sub; // Extraído do JWT

        const result = await ticketService.create(input, reporterId);
        return res.status(201).json(result);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type TicketController = ReturnType<typeof createTicketController>;