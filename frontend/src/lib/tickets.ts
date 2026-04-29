import { api } from "./api";
import { mockTickets } from "./mock-tickets";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketListItem = {
  id: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; name: string; email: string };
  assignee: { id: string; name: string; email: string } | null;
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

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function buildQuery(filters: ListTicketsFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));
  return params.toString();
}

export async function listTickets(
  filters: ListTicketsFilters = {},
): Promise<TicketListResponse> {
  if (useMock) {
    let data = [...mockTickets];
    if (filters.status) data = data.filter((t) => t.status === filters.status);
    if (filters.priority)
      data = data.filter((t) => t.priority === filters.priority);
    return {
      data,
      total: data.length,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
      totalPages: 1,
    };
  }
  return api<TicketListResponse>(`/tickets?${buildQuery(filters)}`);
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<TicketListItem> {
  if (useMock) {
    const now = new Date().toISOString();
    const fake: TicketListItem = {
      id: `mock-${Date.now()}`,
      title: input.title,
      description: input.description ?? null,
      status: "OPEN",
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      reporter: { id: "mock-user", name: "Você (mock)", email: "mock@local" },
      assignee: null,
      category: { id: input.categoryId, name: "Categoria (mock)" },
      location: { id: input.locationId, name: "Local (mock)" },
    };
    mockTickets.unshift(fake);
    return fake;
  }
  return api<TicketListItem>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
