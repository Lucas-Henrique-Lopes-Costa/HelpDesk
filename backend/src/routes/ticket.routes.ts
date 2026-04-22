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

ticketRouter.post("/", authenticate, validateBody(createTicketSchema), (req, res, next) =>
  ticketController.create(req, res, next),
);