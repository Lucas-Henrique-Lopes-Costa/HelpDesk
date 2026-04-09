import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Token ausente"));
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new ForbiddenError());
    }
    return next();
  };
}
