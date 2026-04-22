import { Request, Response, NextFunction } from "express";
import { jwtService, JwtPayload } from "../config/jwt";
import { UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token não fornecido");
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const payload = jwtService.verify(token);

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}