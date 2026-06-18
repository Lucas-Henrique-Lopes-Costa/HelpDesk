import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole } from "@prisma/client";

export function createUsersController(prisma: PrismaClient) {
  return {
    async listByRole(req: Request, res: Response, next: NextFunction) {
      try {
        const { role } = req.query as { role?: string };

        if (!role) {
          return res.status(400).json({
            error: "BAD_REQUEST",
            message: "Query parameter 'role' é obrigatório",
          });
        }

        if (!Object.values(UserRole).includes(role as UserRole)) {
          return res.status(400).json({
            error: "BAD_REQUEST",
            message: "Role inválido",
          });
        }

        const users = await prisma.user.findMany({
          where: {
            role: role as UserRole,
            active: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        return res.status(200).json(users);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type UsersController = ReturnType<typeof createUsersController>;
