import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { TicketService } from "../services/ticket.service";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  locationId: z.string().uuid("ID do local deve ser um UUID válido"),
  categoryId: z.string().uuid("ID da categoria deve ser um UUID válido"),
  priority: z.nativeEnum(TicketPriority, { errorMap: () => ({ message: "Prioridade deve ser LOW, MEDIUM, HIGH ou CRITICAL" }) }),
});

export const listTicketsSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
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

    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const filters = {
          status: req.query.status as any,
          priority: req.query.priority as any,
          categoryId: req.query.categoryId as string,
          locationId: req.query.locationId as string,
          assigneeId: req.query.assigneeId as string,
        };

        const options = {
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        };

        const result = await ticketService.list(filters, options);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params as { id: string };
        const result = await ticketService.getById(id);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type TicketController = ReturnType<typeof createTicketController>;