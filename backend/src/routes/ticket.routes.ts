import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import {
  createTicketController,
  createTicketSchema,
} from "../controllers/ticket.controller";
import { createTicketService } from "../services/ticket.service";
import { prisma } from "../config/prisma";

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