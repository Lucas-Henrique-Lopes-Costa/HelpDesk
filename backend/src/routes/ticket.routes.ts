import { Router } from "express";
import { UserRole } from "@prisma/client";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/require-role";
import { authorize } from "../middleware/authorize";
import {
  createTicketController,
  createTicketSchema,
  updateStatusSchema,
} from "../controllers/ticket.controller";
import { createTicketService } from "../services/ticket.service";
import { prisma } from "../config/prisma";

const ticketService = createTicketService(prisma);
const ticketController = createTicketController(ticketService);

export const ticketRouter = Router();

// POST - Criar ticket (solicitantes, gestores e admin)
ticketRouter.post(
  "/",
  authenticate,
  authorize(UserRole.REQUESTER, UserRole.MANAGER, UserRole.ADMIN),
  validateBody(createTicketSchema),
  (req, res, next) => ticketController.create(req, res, next),
);

// GET - Listar tickets (apenas operacional, gestores e admin enxergam o backlog)
ticketRouter.get(
  "/",
  authenticate,
  authorize(UserRole.MANAGER, UserRole.ADMIN, UserRole.OPERATOR),
  (req, res, next) => ticketController.list(req, res, next),
);

// GET - Detalhar ticket específico (qualquer usuário autenticado; ownership do REQUESTER será aplicada no Sprint 2)
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