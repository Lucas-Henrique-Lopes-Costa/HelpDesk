import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { TicketService } from "../services/ticket.service";
import { VALID_TRANSITIONS } from "../utils/ticket-transitions";

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
  slaBreached: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus, { errorMap: () => ({ message: "Status inválido" }) }),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comentário não pode estar vazio").max(5000, "Comentário muito longo"),
});

export const createAttachmentSchema = z.object({
  url: z.string().url("URL inválida"),
  mimeType: z.string().min(1, "Tipo MIME é obrigatório"),
  sizeBytes: z.number().int().positive("Tamanho deve ser positivo"),
  kind: z.enum(["BEFORE", "AFTER"]),
});

export const assignTicketSchema = z.object({
  assigneeId: z.string().uuid("ID do responsável deve ser um UUID válido").nullable(),
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
          slaBreached: req.query.slaBreached ? req.query.slaBreached === "true" : undefined,
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

    async updateStatus(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params as { id: string };
        const input = req.body;

        const result = await ticketService.updateStatus(id, input);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },

    // ===== COMENTÁRIOS =====
    async listComments(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const result = await ticketService.listComments(id);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },

    async createComment(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const { body } = req.body;
        const authorId = req.user.sub;

        const result = await ticketService.createComment(id, authorId, body);
        return res.status(201).json(result);
      } catch (err) {
        return next(err);
      }
    },

    // ===== ANEXOS =====
    async listAttachments(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const result = await ticketService.listAttachments(id);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },

    async createAttachment(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const { url, mimeType, sizeBytes, kind } = req.body;

        const result = await ticketService.createAttachment(id, url, mimeType, sizeBytes, kind);
        return res.status(201).json(result);
      } catch (err) {
        return next(err);
      }
    },

    // ===== ATRIBUIÇÃO =====
    async assignTicket(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const { assigneeId } = req.body;
        const userId = req.user.sub;
        const userRole = req.user.role;

        const result = await ticketService.assignTicket(id, assigneeId, userId, userRole);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },

    // ===== ESTATÍSTICAS =====
    async getStats(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await ticketService.getStats();
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type TicketController = ReturnType<typeof createTicketController>;