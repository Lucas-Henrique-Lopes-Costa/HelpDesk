import { Router } from "express";
import { validateBody } from "../middleware/validate";
import {
  createAuthController,
  loginSchema,
  registerSchema,
} from "../controllers/auth.controller";
import { createAuthService } from "../services/auth.service";
import { prisma } from "../config/prisma";

const authService = createAuthService(prisma);
const authController = createAuthController(authService);

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
);

authRouter.post("/login", validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);
