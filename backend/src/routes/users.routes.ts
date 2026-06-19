import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody } from "../middleware/validate";
import { createUsersController, createUserSchema } from "../controllers/users.controller";
import { prisma } from "../config/prisma";

const usersController = createUsersController(prisma);

export const usersRouter = Router();

// POST - Criar usuário com papel definido (somente ADMIN)
usersRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validateBody(createUserSchema),
  (req, res, next) => usersController.create(req, res, next),
);

// GET - Listar usuários por role (qualquer autenticado)
usersRouter.get(
  "/",
  authenticate,
  (req, res, next) => usersController.listByRole(req, res, next),
);
