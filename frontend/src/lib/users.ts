import { api } from "./api";
import { useMock, type UserMini } from "./tickets";
import * as mock from "./mock-db";

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
