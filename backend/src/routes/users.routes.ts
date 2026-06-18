import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { createUsersController } from "../controllers/users.controller";
import { prisma } from "../config/prisma";

const usersController = createUsersController(prisma);

export const usersRouter = Router();

// GET - Listar usuários por role (qualquer autenticado)
usersRouter.get(
  "/",
  authenticate,
  (req, res, next) => usersController.listByRole(req, res, next),
);
