import { createUsersService } from "../../src/services/users.service";
import { hashService } from "../../src/services/hash.service";
import { ConflictError } from "../../src/utils/errors";
import { UserRole } from "@prisma/client";

type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
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
      create: jest.fn(async ({ data }: { data: Omit<UserRow, "id" | "createdAt" | "updatedAt" | "active"> }) => {
        const now = new Date();
        const row: UserRow = {
          id: `u-${store.size + 1}`,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        store.set(row.id, row);
        return row;
      }),
      findMany: jest.fn(async ({ where }: { where: { role: UserRole; active: boolean } }) =>
        Array.from(store.values())
          .filter((u) => u.role === where.role && u.active === where.active)
          .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      ),
    },
  };
}

describe("usersService", () => {
  const baseInput = {
    name: "Carlos Operador",
    email: "carlos@helpdesk.local",
    password: "helpdesk123",
    role: UserRole.OPERATOR,
  };

  it("cria usuário com o papel informado e hash de senha, sem devolver passwordHash", async () => {
    const prisma = makePrismaMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = createUsersService(prisma as any);

    const user = await service.create(baseInput);

    expect(user).toEqual({
      id: expect.any(String),
      name: "Carlos Operador",
      email: "carlos@helpdesk.local",
      role: UserRole.OPERATOR,
    });
    expect((user as Record<string, unknown>).passwordHash).toBeUndefined();

    // a senha foi de fato hasheada
    const stored = prisma.store.get(user.id)!;
    expect(stored.passwordHash).not.toBe(baseInput.password);
    await expect(hashService.compare(baseInput.password, stored.passwordHash)).resolves.toBe(true);
  });

  it("respeita o papel escolhido (MANAGER / REQUESTER)", async () => {
    const prisma = makePrismaMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = createUsersService(prisma as any);

    const manager = await service.create({ ...baseInput, email: "m@helpdesk.local", role: UserRole.MANAGER });
    const requester = await service.create({ ...baseInput, email: "r@helpdesk.local", role: UserRole.REQUESTER });

    expect(manager.role).toBe(UserRole.MANAGER);
    expect(requester.role).toBe(UserRole.REQUESTER);
  });

  it("lança ConflictError quando o e-mail já existe", async () => {
    const prisma = makePrismaMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = createUsersService(prisma as any);

    await service.create(baseInput);

    await expect(service.create(baseInput)).rejects.toThrow(ConflictError);
  });

  it("listByRole retorna apenas usuários ativos do papel pedido", async () => {
    const prisma = makePrismaMock();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = createUsersService(prisma as any);

    await service.create({ ...baseInput, email: "op1@helpdesk.local", role: UserRole.OPERATOR });
    await service.create({ ...baseInput, email: "op2@helpdesk.local", role: UserRole.OPERATOR });
    await service.create({ ...baseInput, email: "mgr@helpdesk.local", role: UserRole.MANAGER });

    const operators = await service.listByRole(UserRole.OPERATOR);

    expect(operators).toHaveLength(2);
    expect(operators.every((u) => u.role === UserRole.OPERATOR)).toBe(true);
  });
});
