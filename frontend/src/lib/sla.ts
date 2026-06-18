import type { TicketListItem, TicketPriority, TicketStatus } from "./tickets";

export type SlaUrgency = "none" | "ok" | "soon" | "breached" | "done";

const SOON_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4h para o prazo => "vence em breve"
const TERMINAL: TicketStatus[] = ["RESOLVED", "CLOSED", "CANCELED"];

export type SlaInfo = {
  urgency: SlaUrgency;
  /** ms até o vencimento (negativo = atrasado). null quando não há dueAt. */
  remainingMs: number | null;
  breached: boolean;
  label: string;
};

/** Humaniza uma duração em ms (ex.: "2 dias", "5h 10min", "12min"). */
function humanize(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days >= 1) return `${days} ${days === 1 ? "dia" : "dias"}`;
  if (hours >= 1) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  return `${Math.max(mins, 1)}min`;
}

export function slaInfo(ticket: Pick<TicketListItem, "status" | "dueAt" | "slaBreached">): SlaInfo {
  const dueAt = ticket.dueAt ?? null;

  if (TERMINAL.includes(ticket.status)) {
    return { urgency: "done", remainingMs: null, breached: false, label: "—" };
  }
  if (!dueAt) {
    return { urgency: "none", remainingMs: null, breached: false, label: "Sem prazo" };
  }

  const remainingMs = new Date(dueAt).getTime() - Date.now();
  const breached = ticket.slaBreached === true || remainingMs < 0;

  if (breached) {
    return {
      urgency: "breached",
      remainingMs,
      breached: true,
      label: `Atrasado há ${humanize(Math.abs(remainingMs))}`,
    };
  }
  if (remainingMs <= SOON_THRESHOLD_MS) {
    return {
      urgency: "soon",
      remainingMs,
      breached: false,
      label: `Vence em ${humanize(remainingMs)}`,
    };
  }
  return {
    urgency: "ok",
    remainingMs,
    breached: false,
    label: `Vence em ${humanize(remainingMs)}`,
  };
}

const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * Comparador para a fila do operador: mais urgente primeiro.
 * Ordem: atrasados (mais atrasado no topo) > menor prazo restante >
 * maior prioridade. Chamados sem prazo/terminados vão para o fim.
 */
export function compareByUrgency(a: TicketListItem, b: TicketListItem): number {
  const sa = slaInfo(a);
  const sb = slaInfo(b);

  const rank = (s: SlaInfo) =>
    s.urgency === "breached" ? 0 : s.urgency === "soon" || s.urgency === "ok" ? 1 : 2;
  const ra = rank(sa);
  const rb = rank(sb);
  if (ra !== rb) return ra - rb;

  // Dentro do mesmo grupo, menor remainingMs primeiro (mais negativo = mais atrasado).
  if (sa.remainingMs !== null && sb.remainingMs !== null && sa.remainingMs !== sb.remainingMs) {
    return sa.remainingMs - sb.remainingMs;
  }

  // Empate: prioridade mais alta primeiro.
  return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
}
