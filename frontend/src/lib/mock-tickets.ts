import type { TicketListItem } from "./tickets";

const baseDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const mockTickets: TicketListItem[] = [
  {
    id: "mock-1",
    title: "Ar-condicionado da sala 12 não liga",
    description: "Após queda de energia ontem o equipamento não responde.",
    status: "OPEN",
    priority: "HIGH",
    createdAt: baseDate(0),
    updatedAt: baseDate(0),
    reporter: {
      id: "u-001",
      name: "Maria Souza",
      email: "maria@helpdesk.local",
    },
    assignee: null,
    category: { id: "cat-001", name: "Manutenção", slaHours: 24 },
    location: {
      id: "loc-001",
      name: "Sala 12",
      building: "Prédio A",
      floor: "1º Andar",
    },
  },
  {
    id: "mock-2",
    title: "Repor papel toalha nos banheiros do 2º andar",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAt: baseDate(1),
    updatedAt: baseDate(0),
    reporter: { id: "u-002", name: "João Lima", email: "joao@helpdesk.local" },
    assignee: {
      id: "t-001",
      name: "Carlos Tec",
      email: "carlos@helpdesk.local",
    },
    category: { id: "cat-003", name: "Insumos", slaHours: 48 },
    location: {
      id: "loc-002",
      name: "Banheiros",
      building: "Prédio B",
      floor: "2º Andar",
    },
  },
  {
    id: "mock-3",
    title: "Vazamento embaixo da pia da copa",
    status: "RESOLVED",
    priority: "CRITICAL",
    createdAt: baseDate(3),
    updatedAt: baseDate(1),
    reporter: { id: "u-003", name: "Ana Reis", email: "ana@helpdesk.local" },
    assignee: {
      id: "t-002",
      name: "Pedro Encanador",
      email: "pedro@helpdesk.local",
    },
    category: { id: "cat-001", name: "Manutenção", slaHours: 24 },
    location: {
      id: "loc-003",
      name: "Copa",
      building: "Prédio A",
      floor: "Térreo",
    },
  },
  {
    id: "mock-4",
    title: "Solicitação de limpeza pós-evento auditório",
    status: "OPEN",
    priority: "LOW",
    createdAt: baseDate(2),
    updatedAt: baseDate(2),
    reporter: { id: "u-004", name: "Bruno Dias", email: "bruno@helpdesk.local" },
    assignee: null,
    category: { id: "cat-002", name: "Limpeza", slaHours: 4 },
    location: {
      id: "loc-004",
      name: "Auditório",
      building: "Prédio C",
      floor: "Térreo",
    },
  },
  {
    id: "mock-5",
    title: "Troca de lâmpadas queimadas no corredor leste",
    status: "CLOSED",
    priority: "LOW",
    createdAt: baseDate(7),
    updatedAt: baseDate(5),
    reporter: {
      id: "u-005",
      name: "Carla Mendes",
      email: "carla@helpdesk.local",
    },
    assignee: {
      id: "t-001",
      name: "Carlos Tec",
      email: "carlos@helpdesk.local",
    },
    category: { id: "cat-001", name: "Manutenção", slaHours: 24 },
    location: {
      id: "loc-005",
      name: "Corredor Leste",
      building: "Prédio A",
      floor: "1º Andar",
    },
  },
];
