import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../src/middleware/authenticate";
import { authorize } from "../../src/middleware/authorize";
import { jwtService } from "../../src/config/jwt";
import { ForbiddenError, UnauthorizedError } from "../../src/utils/errors";

function makeReq(headers: Record<string, string> = {}, user?: Request["user"]): Request {
  return { headers, user } as unknown as Request;
}

const noopRes = {} as Response;

describe("authenticate", () => {
  it("chama next com UnauthorizedError quando não há header Authorization", () => {
    const req = makeReq();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, noopRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("chama next com erro quando o token Bearer é inválido", () => {
    const req = makeReq({ authorization: "Bearer not-a-valid-jwt" });
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, noopRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const arg = (next as jest.Mock).mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);
    expect(arg).toBeDefined();
  });

  it("popula req.user quando o token é válido", () => {
    const token = jwtService.sign({
      sub: "user-1",
      email: "lucas@helpdesk.local",
      role: "MANAGER",
    });
    const req = makeReq({ authorization: `Bearer ${token}` });
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, noopRes, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({
      sub: "user-1",
      email: "lucas@helpdesk.local",
      role: "MANAGER",
    });
  });
});

describe("authorize", () => {
  it("chama next com UnauthorizedError quando req.user está ausente", () => {
    const req = makeReq();
    const next = jest.fn() as unknown as NextFunction;

    authorize(UserRole.MANAGER)(req, noopRes, next);

    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("chama next com ForbiddenError quando a role não está autorizada", () => {
    const req = makeReq({}, {
      sub: "user-2",
      email: "ana@helpdesk.local",
      role: UserRole.REQUESTER,
    });
    const next = jest.fn() as unknown as NextFunction;

    authorize(UserRole.MANAGER)(req, noopRes, next);

    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it("permite o acesso quando a role bate com qualquer uma das aceitas", () => {
    const req = makeReq({}, {
      sub: "user-3",
      email: "admin@helpdesk.local",
      role: UserRole.ADMIN,
    });
    const next = jest.fn() as unknown as NextFunction;

    authorize(UserRole.MANAGER, UserRole.ADMIN)(req, noopRes, next);

    expect(next).toHaveBeenCalledWith();
  });
});
