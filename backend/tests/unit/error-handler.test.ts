import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../src/middleware/error-handler";
import {
  AppError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../src/utils/errors";

const noopReq = {} as Request;
const noopNext = jest.fn() as unknown as NextFunction;

function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
}

describe("errorHandler", () => {
  it("responde com o statusCode e code de um AppError direto", () => {
    // Arrange
    const err = new AppError("Requisição inválida", 400, "APP_ERROR");
    const res = makeRes();

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(400);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith({
      error: "APP_ERROR",
      message: "Requisição inválida",
    });
  });

  it("responde 401 com UNAUTHORIZED para UnauthorizedError", () => {
    // Arrange
    const err = new UnauthorizedError();
    const res = makeRes();

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(401);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith({
      error: "UNAUTHORIZED",
      message: "Credenciais inválidas",
    });
  });

  it("responde 404 com NOT_FOUND para NotFoundError", () => {
    // Arrange
    const err = new NotFoundError();
    const res = makeRes();

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(404);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith({
      error: "NOT_FOUND",
      message: "Recurso não encontrado",
    });
  });

  it("responde 403 com FORBIDDEN para ForbiddenError", () => {
    // Arrange
    const err = new ForbiddenError();
    const res = makeRes();

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(403);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith({
      error: "FORBIDDEN",
      message: "Acesso negado",
    });
  });

  it("responde 500 com INTERNAL_SERVER_ERROR para erro genérico", () => {
    // Arrange
    const err = new Error("boom");
    const res = makeRes();
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(500);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith({
      error: "INTERNAL_SERVER_ERROR",
      message: "Erro inesperado, verifique os logs do servidor.",
    });

    jest.restoreAllMocks();
  });

  it("chama console.error com '[unhandled]' e o erro para erros genéricos", () => {
    // Arrange
    const err = new Error("boom");
    const res = makeRes();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Act
    errorHandler(err, noopReq, res, noopNext);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith("[unhandled]", err);

    consoleSpy.mockRestore();
  });
});
