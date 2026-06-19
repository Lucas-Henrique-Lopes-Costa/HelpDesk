import { PrismaClient, User, UserRole } from "@prisma/client";
import { hashService } from "./hash.service";
import { ConflictError } from "../utils/errors";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

// Usuário "público" — nunca devolvemos o passwordHash.
export type PublicUser = Pick<User, "id" | "name" | "email" | "role">;

export type UsersService = ReturnType<typeof createUsersService>;

export function createUsersService(prisma: PrismaClient) {
  return {
    async create(input: CreateUserInput): Promise<PublicUser> {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new ConflictError("Já existe um usuário com este e-mail");
      }

      const passwordHash = await hashService.hash(input.password);
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
        },
      });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },

    async listByRole(role: UserRole): Promise<PublicUser[]> {
      return prisma.user.findMany({
        where: { role, active: true },
        select: { id: true, name: true, email: true, role: true },
      });
    },
  };
}
