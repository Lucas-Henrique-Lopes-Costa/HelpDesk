import type { TicketStatus } from "./tickets";

// Papéis alinhados ao enum UserRole do backend (Prisma / OpenAPI).
export type UserRole = "REQUESTER" | "OPERATOR" | "MANAGER" | "ADMIN";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  OPERATOR: "Operador",
  REQUESTER: "Solicitante",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
}

// Grupos de papéis reutilizáveis (referência estável para guards/hooks).
export const QUEUE_ROLES: UserRole[] = ["OPERATOR", "MANAGER", "ADMIN"];
export const INSIGHTS_ROLES: UserRole[] = ["MANAGER", "ADMIN"];

// ---------------------------------------------------------------------------
// Permissões por ação (espelham o RBAC do backend — épicos #29/#30).
// A UI esconde o que o papel não pode fazer; o backend continua sendo a fonte
// de verdade e responde 403 caso algo escape.
// ---------------------------------------------------------------------------

/** Pode listar o backlog completo (GET /tickets). REQUESTER vê só os próprios. */
export function canViewBacklog(role: UserRole): boolean {
  return role === "MANAGER" || role === "ADMIN" || role === "OPERATOR";
}

/** Pode abrir chamado (POST /tickets). */
export function canOpenTicket(role: UserRole): boolean {
  return role === "REQUESTER" || role === "MANAGER" || role === "ADMIN";
}

/** Pode mudar status pela máquina de estados (PATCH /tickets/:id/status). */
export function canChangeStatus(role: UserRole): boolean {
  return role === "OPERATOR" || role === "MANAGER" || role === "ADMIN";
}

/** Pode atribuir um chamado a outro operador (PATCH /tickets/:id/assign). */
export function canAssignOthers(role: UserRole): boolean {
  return role === "MANAGER" || role === "ADMIN";
}

/** Operador pode assumir um chamado para si (self-assign). */
export function canSelfAssign(role: UserRole): boolean {
  return role === "OPERATOR";
}

/** Pode comentar na timeline do chamado. */
export function canComment(): boolean {
  return true;
}

/** Acessa a fila priorizada do operador. */
export function canViewQueue(role: UserRole): boolean {
  return role === "OPERATOR" || role === "MANAGER" || role === "ADMIN";
}

/** Acessa o dashboard executivo de indicadores. */
export function canViewInsights(role: UserRole): boolean {
  return role === "MANAGER" || role === "ADMIN";
}

// ---------------------------------------------------------------------------
// Máquina de estados — espelha backend/src/utils/ticket-transitions.ts.
// ---------------------------------------------------------------------------

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["RESOLVED", "CANCELED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  CANCELED: [],
};

export function nextStatuses(current: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

/** Rótulo da AÇÃO que leva o chamado ao status de destino. */
export const TRANSITION_LABELS: Record<TicketStatus, string> = {
  OPEN: "Reabrir",
  IN_PROGRESS: "Iniciar atendimento",
  RESOLVED: "Marcar como resolvido",
  CLOSED: "Fechar chamado",
  CANCELED: "Cancelar",
};
