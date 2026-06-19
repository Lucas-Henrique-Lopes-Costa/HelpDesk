import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClient, UserRole } from "@prisma/client";
import { createUsersService } from "../services/users.service";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Papel deve ser ADMIN, MANAGER, OPERATOR ou REQUESTER" }),
  }),
});

export function createUsersController(prisma: PrismaClient) {
  const usersService = createUsersService(prisma);

  return {
    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const user = await usersService.create(req.body);
        return res.status(201).json(user);
      } catch (err) {
        return next(err);
      }
    },

    async listByRole(req: Request, res: Response, next: NextFunction) {
      try {
        const { role } = req.query as { role?: string };

        // role é opcional: sem ele, devolve todos. Com ele, precisa ser válido.
        if (role && !Object.values(UserRole).includes(role as UserRole)) {
          return res.status(400).json({
            error: "BAD_REQUEST",
            message: "Role inválido",
          });
        }

        const users = await usersService.listByRole(role as UserRole | undefined);
        return res.status(200).json(users);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type UsersController = ReturnType<typeof createUsersController>;
