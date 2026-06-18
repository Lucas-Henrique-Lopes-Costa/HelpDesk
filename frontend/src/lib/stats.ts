import { api } from "./api";
import { useMock, type TicketStatus } from "./tickets";
import * as mock from "./mock-db";

export type AssigneeLoad = {
  assigneeId: string | null;
  assigneeName: string;
  count: number;
};

export type CategoryLoad = {
  categoryId: string;
  categoryName: string;
  count: number;
};

export type TicketStats = {
  /** Total de chamados por status. */
  byStatus: Record<TicketStatus, number>;
  /** Quantidade com SLA estourado. */
  slaBreached: number;
  /** Carga por responsável (inclui não atribuídos). */
  byAssignee: AssigneeLoad[];
  /** Chamados por categoria. */
  byCategory: CategoryLoad[];
};

const EMPTY_BY_STATUS: Record<TicketStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 0,
  RESOLVED: 0,
  CLOSED: 0,
  CANCELED: 0,
};

/** Garante a forma esperada mesmo que o backend omita chaves. */
export function normalizeStats(raw: Partial<TicketStats> | undefined): TicketStats {
  return {
    byStatus: { ...EMPTY_BY_STATUS, ...(raw?.byStatus ?? {}) },
    slaBreached: raw?.slaBreached ?? 0,
    byAssignee: raw?.byAssignee ?? [],
    byCategory: raw?.byCategory ?? [],
  };
}

export async function getStats(): Promise<TicketStats> {
  if (useMock) return mock.getStats();
  return normalizeStats(await api<Partial<TicketStats>>(`/tickets/stats`));
}
