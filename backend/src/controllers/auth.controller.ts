import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { AuthService } from "../services/auth.service";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.nativeEnum(UserRole).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export function createAuthController(authService: AuthService) {
  return {
    async register(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await authService.register(req.body);
        return res.status(201).json(result);
      } catch (err) {
        return next(err);
      }
    },

    async login(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await authService.login(req.body);
        return res.status(200).json(result);
      } catch (err) {
        return next(err);
      }
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
