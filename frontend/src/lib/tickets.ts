import { api } from "./api";
import * as mock from "./mock-db";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type UserMini = { id: string; name: string; email: string };

export type TicketListItem = {
  id: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  /** Prazo de SLA calculado na abertura (épico #30, US-06). */
  dueAt?: string | null;
  /** Derivação exposta pelo backend quando o prazo estourou. */
  slaBreached?: boolean;
  reporter: UserMini;
  assignee: UserMini | null;
  category: { id: string; name: string; slaHours?: number };
  location: {
    id: string;
    name: string;
    building?: string | null;
    floor?: string | null;
  };
};

export type TicketListResponse = {
  data: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListTicketsFilters = {
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  assigneeId?: string;
  slaBreached?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateTicketInput = {
  title: string;
  description?: string;
  locationId: string;
  categoryId: string;
  priority: TicketPriority;
};

export const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function buildQuery(filters: ListTicketsFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.slaBreached) params.set("slaBreached", "true");
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));
  return params.toString();
}

export async function listTickets(
  filters: ListTicketsFilters = {},
): Promise<TicketListResponse> {
  if (useMock) return mock.listTickets(filters);
  return api<TicketListResponse>(`/tickets?${buildQuery(filters)}`);
}

export async function getTicket(id: string): Promise<TicketListItem> {
  if (useMock) return mock.getTicket(id);
  return api<TicketListItem>(`/tickets/${id}`);
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<TicketListItem> {
  if (useMock) return mock.createTicket(input);
  return api<TicketListItem>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<TicketListItem> {
  if (useMock) return mock.updateTicketStatus(id, status);
  return api<TicketListItem>(`/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * Atribui (ou reatribui) o chamado. `assignee = null` desatribui.
 * No backend o corpo é `{ assigneeId }`; operador que assume passa o próprio id.
 */
export async function assignTicket(
  id: string,
  assignee: UserMini | null,
): Promise<TicketListItem> {
  if (useMock) return mock.assignTicket(id, assignee);
  return api<TicketListItem>(`/tickets/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigneeId: assignee?.id ?? null }),
  });
}

/** Exclui um chamado (DELETE /tickets/:id). Somente ADMIN no backend. */
export async function deleteTicket(id: string): Promise<void> {
  if (useMock) return mock.deleteTicket(id);
  await api<void>(`/tickets/${id}`, { method: "DELETE" });
}
