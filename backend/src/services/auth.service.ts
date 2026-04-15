import { PrismaClient, User, UserRole } from "@prisma/client";
import { hashService } from "./hash.service";
import { jwtService } from "../config/jwt";
import { ConflictError, UnauthorizedError } from "../utils/errors";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: Pick<User, "id" | "name" | "email" | "role">;
};

export function createAuthService(prisma: PrismaClient) {
  return {
    async register(input: RegisterInput): Promise<AuthResponse> {
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
          role: input.role ?? UserRole.REQUESTER,
        },
      });

      return this.buildAuthResponse(user);
    },

    async login(input: LoginInput): Promise<AuthResponse> {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user || !user.active) {
        throw new UnauthorizedError();
      }

      const ok = await hashService.compare(input.password, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedError();
      }

      return this.buildAuthResponse(user);
    },

    buildAuthResponse(user: User): AuthResponse {
      const token = jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
