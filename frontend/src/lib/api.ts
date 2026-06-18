const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hd_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string }).message ?? `HTTP ${res.status}`,
    );
  }

  return data as T;
}

/**
 * Upload multipart (FormData). NÃO define Content-Type manualmente — o browser
 * precisa gerar o boundary do multipart/form-data sozinho.
 */
export async function apiUpload<T>(
  path: string,
  form: FormData,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    ...options,
    body: form,
    headers: {
      ...authHeader(),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string }).message ?? `HTTP ${res.status}`,
    );
  }

  return data as T;
}

/**
 * Converte qualquer erro de fetch numa mensagem clara para o usuário,
 * com tratamento especial dos status de RBAC (401/403).
 */
export function messageFromError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    if (err.status === 403) {
      return "Você não tem permissão para esta ação.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro inesperado.";
}

/** true quando o erro indica sessão inválida/expirada (401). */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/** true quando o erro indica falta de permissão do papel (403). */
export function isForbidden(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403;
}
