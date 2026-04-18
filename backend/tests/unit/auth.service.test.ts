import { createAuthService } from "../../src/services/auth.service";
import { hashService } from "../../src/services/hash.service";
import { ConflictError, UnauthorizedError } from "../../src/utils/errors";

type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "MANAGER" | "REQUESTER" | "OPERATOR";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function makePrismaMock() {
  const store = new Map<string, UserRow>();
  return {
    store,
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email: string } }) => {
        for (const u of store.values()) {
          if (u.email === where.email) return u;
        }
        return null;
      }),
      create: jest.fn(async ({ data }: { data: Omit<UserRow, "id" | "createdAt" | "updatedAt" | "active"> & { active?: boolean } }) => {
        const now = new Date();
        const row: UserRow = {
          id: `u-${store.size + 1}`,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role ?? "REQUESTER",
          active: data.active ?? true,
          createdAt: now,
          updatedAt: now,
        };
        store.set(row.id, row);
        return row;
      }),
    },
  };
}

describe("authService", () => {
  const validInput = {
    name: "Lucas",
    email: "lucas@helpdesk.local",
    password: "secret123",
  };

  it("register cria usuário e retorna token + user sem passwordHash", async () => {
    const prisma = makePrismaMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authService = createAuthService(prisma as any);

    const res = await authService.register(validInput);

    expect(res.token).toEqual(expect.any(String));
    expect(res.user.email).toBe(validInput.email);
    expect((res.user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });

  it("register lança ConflictError se e-mail já existe", async () => {
    const prisma = makePrismaMock();
    prisma.store.set("u-0", {
      id: "u-0",
      name: "Existing",
      email: validInput.email,
      passwordHash: await hashService.hash("whatever"),
      role: "REQUESTER",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authService = createAuthService(prisma as any);

    await expect(authService.register(validInput)).rejects.toBeInstanceOf(ConflictError);
  });

  it("login devolve token válido para credencial correta", async () => {
    const prisma = makePrismaMock();
    prisma.store.set("u-0", {
      id: "u-0",
      name: "Lucas",
      email: validInput.email,
      passwordHash: await hashService.hash(validInput.password),
      role: "MANAGER",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authService = createAuthService(prisma as any);

    const res = await authService.login({
      email: validInput.email,
      password: validInput.password,
    });

    expect(res.token).toEqual(expect.any(String));
    expect(res.user.role).toBe("MANAGER");
  });

  it("login com senha errada lança UnauthorizedError", async () => {
    const prisma = makePrismaMock();
    prisma.store.set("u-0", {
      id: "u-0",
      name: "Lucas",
      email: validInput.email,
      passwordHash: await hashService.hash(validInput.password),
      role: "REQUESTER",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authService = createAuthService(prisma as any);

    await expect(
      authService.login({ email: validInput.email, password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("login de usuário inativo lança UnauthorizedError", async () => {
    const prisma = makePrismaMock();
    prisma.store.set("u-0", {
      id: "u-0",
      name: "Lucas",
      email: validInput.email,
      passwordHash: await hashService.hash(validInput.password),
      role: "REQUESTER",
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authService = createAuthService(prisma as any);

    await expect(
      authService.login({ email: validInput.email, password: validInput.password }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
