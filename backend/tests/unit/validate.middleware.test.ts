import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { validateBody, isZodError } from "../../src/middleware/validate";

function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
}

describe("validateBody", () => {
  it("chama next() e atribui req.body com o dado parsed quando o corpo é válido", () => {
    // Arrange
    const schema = z.object({ nome: z.string(), idade: z.number() });
    const req = { body: { nome: "Gustavo", idade: 22 } } as unknown as Request;
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    // Act
    validateBody(schema)(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ nome: "Gustavo", idade: 22 });
  });

  it("retorna 422 com VALIDATION_ERROR e issues quando o corpo é inválido", () => {
    // Arrange
    const schema = z.object({ email: z.string().email() });
    const req = { body: { email: "nao-e-um-email" } } as unknown as Request;
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    // Act
    validateBody(schema)(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect((res.status as jest.Mock)).toHaveBeenCalledWith(422);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "VALIDATION_ERROR",
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: "email",
            message: expect.any(String),
          }),
        ]),
      }),
    );
  });
});

describe("isZodError", () => {
  it("retorna true para uma instância de ZodError", () => {
    // Arrange
    const schema = z.object({ x: z.number() });
    let zodErr: unknown;
    try {
      schema.parse({ x: "nao-numero" });
    } catch (err) {
      zodErr = err;
    }

    // Act & Assert
    expect(isZodError(zodErr)).toBe(true);
  });

  it("retorna false para um Error comum", () => {
    // Arrange
    const err = new Error("erro qualquer");

    // Act & Assert
    expect(isZodError(err)).toBe(false);
  });

  it("retorna false para uma string", () => {
    // Arrange
    const err = "mensagem de erro";

    // Act & Assert
    expect(isZodError(err)).toBe(false);
  });
});
