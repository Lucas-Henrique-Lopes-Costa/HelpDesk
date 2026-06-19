import { api } from "./api";
import { useMock, type UserMini } from "./tickets";
import type { UserRole } from "./rbac";
import * as mock from "./mock-db";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Cria um usuário com papel definido. Consome `POST /users` (somente ADMIN no
 * backend). No modo mock, registra em memória para a demo.
 */
export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  if (useMock) return mock.createUser(input);
  return api<PublicUser>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function normalizeList(res: unknown): UserMini[] {
  if (Array.isArray(res)) return res as UserMini[];
  if (res && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: UserMini[] }).data;
  }
  return [];
}

/**
 * Operadores disponíveis para atribuição (usado pelo gestor).
 * Consome `GET /users?role=OPERATOR`. Se o endpoint ainda não existir,
 * degrada para lista vazia em vez de quebrar a tela.
 */
export async function listOperators(): Promise<UserMini[]> {
  if (useMock) return mock.listOperators();
  try {
    return normalizeList(await api<unknown>(`/users?role=OPERATOR`));
  } catch {
    return [];
  }
}
