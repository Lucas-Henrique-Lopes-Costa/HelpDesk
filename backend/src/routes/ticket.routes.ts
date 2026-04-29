import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/require-role";
import {
  createTicketController,
  createTicketSchema,
  updateStatusSchema,
} from "../controllers/ticket.controller";
import { createTicketService } from "../services/ticket.service";
import { prisma } from "../config/prisma";
import { UserRole } from "@prisma/client";

const ticketService = createTicketService(prisma);
const ticketController = createTicketController(ticketService);

export const ticketRouter = Router();

// POST - Criar ticket (autenticado)
ticketRouter.post("/", authenticate, validateBody(createTicketSchema), (req, res, next) =>
  ticketController.create(req, res, next),
);

// GET - Listar tickets (autenticado, com filtros)
ticketRouter.get("/", authenticate, (req, res, next) =>
  ticketController.list(req, res, next),
);

// GET - Detalhar ticket específico (autenticado)
ticketRouter.get("/:id", authenticate, (req, res, next) =>
  ticketController.getById(req, res, next),
);

// PATCH - Atualizar status do ticket (autenticado como MANAGER ou OPERATOR)
ticketRouter.patch(
  "/:id/status",
  authenticate,
  requireRole(UserRole.MANAGER, UserRole.OPERATOR),
  validateBody(updateStatusSchema),
  (req, res, next) => ticketController.updateStatus(req, res, next),
);