import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled]", err);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Erro inesperado, verifique os logs do servidor.",
  });
}
