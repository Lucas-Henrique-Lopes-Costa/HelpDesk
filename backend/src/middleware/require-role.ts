import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/errors";
import { UserRole } from "@prisma/client";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role as UserRole;

    if (!roles.includes(userRole)) {
      throw new ForbiddenError(`Acesso negado. Roles permitidas: ${roles.join(", ")}`);
    }

    next();
  };
}
