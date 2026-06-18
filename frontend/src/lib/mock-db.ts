// Backend em memória para o modo mock (NEXT_PUBLIC_USE_MOCK=true).
// Implementa o MESMO contrato dos endpoints reais (épicos #30/#31), permitindo
// demonstrar o fluxo completo sem subir Postgres/Redis/MinIO. Os dados vivem em
// memória e são reiniciados a cada reload da página.

import { ApiError } from "./api";
import { VALID_TRANSITIONS } from "./rbac";
import type {
  CreateTicketInput,
  ListTicketsFilters,
  TicketListItem,
  TicketListResponse,
  TicketStatus,
  UserMini,
} from "./tickets";
import type { Comment } from "./comments";
import type { Attachment, AttachmentKind } from "./attachments";
import type { TicketStats } from "./stats";

// --- Usuários -------------------------------------------------------------
const U = {
  admin: { id: "u-admin", name: "Admin Geral", email: "admin@helpdesk.local" },
  manager: { id: "u-manager", name: "Marta Gestora", email: "gestor@helpdesk.local" },
  op1: { id: "u-op-1", name: "Carlos Manutenção", email: "carlos@helpdesk.local" },
  op2: { id: "u-op-2", name: "Pedro Hidráulica", email: "pedro@helpdesk.local" },
  op3: { id: "u-op-3", name: "Joana Elétrica", email: "joana@helpdesk.local" },
  req1: { id: "u-req-1", name: "Maria Souza", email: "maria@helpdesk.local" },
  req2: { id: "u-req-2", name: "João Lima", email: "joao@helpdesk.local" },
  req3: { id: "u-req-3", name: "Ana Reis", email: "ana@helpdesk.local" },
} as const;

const OPERATORS: UserMini[] = [U.op1, U.op2, U.op3];

// --- Catálogos ------------------------------------------------------------
const CATEGORIES = {
  manutencao: { id: "cat-001", name: "Manutenção", slaHours: 24 },
  limpeza: { id: "cat-002", name: "Limpeza", slaHours: 4 },
  insumos: { id: "cat-003", name: "Insumos", slaHours: 48 },
  eletrica: { id: "cat-004", name: "Elétrica", slaHours: 8 },
} as const;

const LOCATIONS = {
  sala12: { id: "loc-001", name: "Sala 12", building: "Prédio A", floor: "1º Andar" },
  banheiros: { id: "loc-002", name: "Banheiros", building: "Prédio B", floor: "2º Andar" },
  copa: { id: "loc-003", name: "Copa", building: "Prédio A", floor: "Térreo" },
  auditorio: { id: "loc-004", name: "Auditório", building: "Prédio C", floor: "Térreo" },
  corredor: { id: "loc-005", name: "Corredor Leste", building: "Prédio A", floor: "1º Andar" },
  datacenter: { id: "loc-006", name: "Data Center", building: "Prédio B", floor: "Subsolo" },
} as const;

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();

type Cat = { id: string; name: string; slaHours: number };

/** Cria um ticket de seed calculando dueAt/slaBreached como o backend faria. */
function build(
  partial: Omit<
    TicketListItem,
    "dueAt" | "slaBreached" | "updatedAt" | "createdAt"
  > & {
    createdAtHoursAgo: number;
  },
): TicketListItem {
  const { createdAtHoursAgo, ...rest } = partial;
  const createdAt = hoursAgo(createdAtHoursAgo);
  const slaHours = rest.category.slaHours ?? 24;
  const dueAt = new Date(new Date(createdAt).getTime() + slaHours * HOUR).toISOString();
  const terminal = ["RESOLVED", "CLOSED", "CANCELED"].includes(rest.status);
  const slaBreached = !terminal && new Date(dueAt).getTime() < Date.now();
  return { ...rest, createdAt, updatedAt: createdAt, dueAt, slaBreached };
}

// --- Estado mutável -------------------------------------------------------
let tickets: TicketListItem[] = [
  build({
    id: "tk-001",
    title: "Ar-condicionado da sala 12 não liga",
    description: "Após a queda de energia de ontem o equipamento não responde.",
    status: "OPEN",
    priority: "HIGH",
    createdAtHoursAgo: 30, // SLA 24h -> estourado
    reporter: U.req1,
    assignee: null,
    category: CATEGORIES.manutencao,
    location: LOCATIONS.sala12,
  }),
  build({
    id: "tk-002",
    title: "Falta de energia em metade do Data Center",
    description: "Rack 3 e 4 sem alimentação. Risco de indisponibilidade.",
    status: "OPEN",
    priority: "CRITICAL",
    createdAtHoursAgo: 10, // SLA 8h -> estourado
    reporter: U.req2,
    assignee: null,
    category: CATEGORIES.eletrica,
    location: LOCATIONS.datacenter,
  }),
  build({
    id: "tk-003",
    title: "Repor papel toalha nos banheiros do 2º andar",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAtHoursAgo: 20,
    reporter: U.req2,
    assignee: U.op1,
    category: CATEGORIES.insumos,
    location: LOCATIONS.banheiros,
  }),
  build({
    id: "tk-004",
    title: "Vazamento embaixo da pia da copa",
    description: "Água acumulando no armário inferior.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdAtHoursAgo: 3,
    reporter: U.req3,
    assignee: U.op2,
    category: CATEGORIES.manutencao,
    location: LOCATIONS.copa,
  }),
  build({
    id: "tk-005",
    title: "Limpeza pós-evento no auditório",
    status: "OPEN",
    priority: "LOW",
    createdAtHoursAgo: 1,
    reporter: U.req1,
    assignee: null,
    category: CATEGORIES.limpeza,
    location: LOCATIONS.auditorio,
  }),
  build({
    id: "tk-006",
    title: "Troca de lâmpadas queimadas no corredor leste",
    status: "RESOLVED",
    priority: "MEDIUM",
    createdAtHoursAgo: 50,
    reporter: U.req3,
    assignee: U.op3,
    category: CATEGORIES.eletrica,
    location: LOCATIONS.corredor,
  }),
  build({
    id: "tk-007",
    title: "Tomada solta na sala 12 (risco de choque)",
    status: "CLOSED",
    priority: "HIGH",
    createdAtHoursAgo: 96,
    reporter: U.req1,
    assignee: U.op3,
    category: CATEGORIES.eletrica,
    location: LOCATIONS.sala12,
  }),
  build({
    id: "tk-008",
    title: "Solicitação duplicada de limpeza",
    status: "CANCELED",
    priority: "LOW",
    createdAtHoursAgo: 60,
    reporter: U.req2,
    assignee: null,
    category: CATEGORIES.limpeza,
    location: LOCATIONS.copa,
  }),
];

// Timestamps de resolução para os terminais (coerência com o backend).
tickets = tickets.map((t) =>
  t.status === "RESOLVED"
    ? { ...t, resolvedAt: hoursAgo(2) }
    : t.status === "CLOSED"
      ? { ...t, resolvedAt: hoursAgo(30), closedAt: hoursAgo(20) }
      : t,
);

const comments: Record<string, Comment[]> = {
  "tk-003": [
    {
      id: "cm-1",
      ticketId: "tk-003",
      author: U.manager,
      body: "Atribuído ao Carlos. Priorizar antes do almoço, por favor.",
      createdAt: hoursAgo(18),
    },
    {
      id: "cm-2",
      ticketId: "tk-003",
      author: U.op1,
      body: "A caminho do estoque para pegar a reposição.",
      createdAt: hoursAgo(12),
    },
  ],
  "tk-004": [
    {
      id: "cm-3",
      ticketId: "tk-004",
      author: U.op2,
      body: "Vazamento identificado no sifão. Vou precisar trocar a peça.",
      createdAt: hoursAgo(1),
    },
  ],
};

const attachments: Record<string, Attachment[]> = {
  "tk-004": [
    {
      id: "att-1",
      ticketId: "tk-004",
      kind: "BEFORE",
      url: "https://placehold.co/640x480/e2e8f0/334155.png?text=Antes",
      mimeType: "image/png",
      sizeBytes: 184320,
      createdAt: hoursAgo(3),
      uploadedBy: U.req3,
    },
  ],
  "tk-006": [
    {
      id: "att-2",
      ticketId: "tk-006",
      kind: "BEFORE",
      url: "https://placehold.co/640x480/e2e8f0/334155.png?text=Antes",
      mimeType: "image/png",
      sizeBytes: 201111,
      createdAt: hoursAgo(50),
      uploadedBy: U.req3,
    },
    {
      id: "att-3",
      ticketId: "tk-006",
      kind: "AFTER",
      url: "https://placehold.co/640x480/dcfce7/166534.png?text=Depois",
      mimeType: "image/png",
      sizeBytes: 198765,
      createdAt: hoursAgo(2),
      uploadedBy: U.op3,
    },
  ],
};

// --- Utilidades -----------------------------------------------------------
let seq = 100;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

/** Usuário logado no modo mock (gravado pelo auth-context). Fallback: solicitante. */
function currentUser(): UserMini {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("hd_user");
      if (raw) {
        const u = JSON.parse(raw) as { id: string; name: string; email: string };
        if (u?.id) return { id: u.id, name: u.name, email: u.email };
      }
    } catch {
      // ignora JSON inválido
    }
  }
  return U.req1;
}

function findCategory(id: string): Cat {
  return (
    Object.values(CATEGORIES).find((c) => c.id === id) ?? {
      id,
      name: "Categoria",
      slaHours: 24,
    }
  );
}

function findLocation(id: string) {
  return (
    Object.values(LOCATIONS).find((l) => l.id === id) ?? {
      id,
      name: "Local",
      building: null,
      floor: null,
    }
  );
}

function recomputeBreach(t: TicketListItem): TicketListItem {
  const terminal = ["RESOLVED", "CLOSED", "CANCELED"].includes(t.status);
  const slaBreached =
    !terminal && !!t.dueAt && new Date(t.dueAt).getTime() < Date.now();
  return { ...t, slaBreached };
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// --- "Endpoints" ----------------------------------------------------------
export async function listTickets(
  filters: ListTicketsFilters = {},
): Promise<TicketListResponse> {
  let data = tickets.map(recomputeBreach);
  if (filters.status) data = data.filter((t) => t.status === filters.status);
  if (filters.priority) data = data.filter((t) => t.priority === filters.priority);
  if (filters.assigneeId) data = data.filter((t) => t.assignee?.id === filters.assigneeId);
  if (filters.slaBreached) data = data.filter((t) => t.slaBreached);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const total = data.length;
  const start = (page - 1) * pageSize;
  return {
    data: clone(data.slice(start, start + pageSize)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTicket(id: string): Promise<TicketListItem> {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new ApiError(404, "Chamado não encontrado");
  return clone(recomputeBreach(t));
}

export async function createTicket(input: CreateTicketInput): Promise<TicketListItem> {
  const category = findCategory(input.categoryId);
  const location = findLocation(input.locationId);
  const createdAt = new Date().toISOString();
  const dueAt = new Date(Date.now() + category.slaHours * HOUR).toISOString();
  const ticket: TicketListItem = {
    id: nextId("tk"),
    title: input.title,
    description: input.description ?? null,
    status: "OPEN",
    priority: input.priority,
    createdAt,
    updatedAt: createdAt,
    dueAt,
    slaBreached: false,
    reporter: currentUser(),
    assignee: null,
    category,
    location,
  };
  tickets.unshift(ticket);
  return clone(ticket);
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<TicketListItem> {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new ApiError(404, "Chamado não encontrado");
  if (!VALID_TRANSITIONS[t.status].includes(status)) {
    throw new ApiError(422, `Transição inválida de ${t.status} para ${status}`);
  }
  t.status = status;
  t.updatedAt = new Date().toISOString();
  if (status === "RESOLVED") t.resolvedAt = t.updatedAt;
  if (status === "CLOSED") t.closedAt = t.updatedAt;
  return clone(recomputeBreach(t));
}

export async function assignTicket(
  id: string,
  assignee: UserMini | null,
): Promise<TicketListItem> {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new ApiError(404, "Chamado não encontrado");
  t.assignee = assignee ? { ...assignee } : null;
  t.updatedAt = new Date().toISOString();
  // Assumir um chamado aberto move automaticamente para IN_PROGRESS.
  if (assignee && t.status === "OPEN") t.status = "IN_PROGRESS";
  return clone(recomputeBreach(t));
}

export async function listComments(ticketId: string): Promise<Comment[]> {
  return clone(comments[ticketId] ?? []);
}

export async function addComment(ticketId: string, body: string): Promise<Comment> {
  const comment: Comment = {
    id: nextId("cm"),
    ticketId,
    author: currentUser(),
    body,
    createdAt: new Date().toISOString(),
  };
  (comments[ticketId] ??= []).push(comment);
  return clone(comment);
}

export async function listAttachments(ticketId: string): Promise<Attachment[]> {
  return clone(attachments[ticketId] ?? []);
}

export async function uploadAttachment(
  ticketId: string,
  file: File,
  kind: AttachmentKind,
): Promise<Attachment> {
  const url =
    typeof URL !== "undefined" && URL.createObjectURL
      ? URL.createObjectURL(file)
      : "https://placehold.co/640x480/e2e8f0/334155.png?text=Evidencia";
  const attachment: Attachment = {
    id: nextId("att"),
    ticketId,
    kind,
    url,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
    uploadedBy: currentUser(),
  };
  (attachments[ticketId] ??= []).push(attachment);
  return clone({ ...attachment, url }); // mantém o objectURL (não serializável via clone)
}

export async function listOperators(): Promise<UserMini[]> {
  return clone(OPERATORS);
}

export async function getStats(): Promise<TicketStats> {
  const live = tickets.map(recomputeBreach);

  const byStatus: Record<TicketStatus, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    CANCELED: 0,
  };
  const assigneeMap = new Map<string, { name: string; count: number }>();
  const categoryMap = new Map<string, { name: string; count: number }>();
  let slaBreached = 0;

  for (const t of live) {
    byStatus[t.status]++;
    if (t.slaBreached) slaBreached++;

    const aKey = t.assignee?.id ?? "__none__";
    const aName = t.assignee?.name ?? "Não atribuído";
    const a = assigneeMap.get(aKey) ?? { name: aName, count: 0 };
    a.count++;
    assigneeMap.set(aKey, a);

    const c = categoryMap.get(t.category.id) ?? { name: t.category.name, count: 0 };
    c.count++;
    categoryMap.set(t.category.id, c);
  }

  return {
    byStatus,
    slaBreached,
    byAssignee: Array.from(assigneeMap.entries()).map(([id, v]) => ({
      assigneeId: id === "__none__" ? null : id,
      assigneeName: v.name,
      count: v.count,
    })),
    byCategory: Array.from(categoryMap.entries()).map(([id, v]) => ({
      categoryId: id,
      categoryName: v.name,
      count: v.count,
    })),
  };
}

/** Mapeia e-mails de seed para papéis — usado pelo login mockado. */
export function mockRoleForEmail(email: string): "REQUESTER" | "OPERATOR" | "MANAGER" | "ADMIN" {
  const e = email.toLowerCase();
  if (e.startsWith("admin")) return "ADMIN";
  if (e.startsWith("gestor") || e.startsWith("manager")) return "MANAGER";
  if (
    e.startsWith("operador") ||
    e.startsWith("carlos") ||
    e.startsWith("pedro") ||
    e.startsWith("joana")
  ) {
    return "OPERATOR";
  }
  if (e.startsWith("solicitante") || e.startsWith("maria") || e.startsWith("joao") || e.startsWith("ana")) {
    return "REQUESTER";
  }
  return "ADMIN"; // default: enxerga todas as telas na demo
}

export function mockUserForEmail(email: string): UserMini {
  const known = Object.values(U).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (known) return { ...known };
  return { id: `u-${email}`, name: email.split("@")[0], email };
}
